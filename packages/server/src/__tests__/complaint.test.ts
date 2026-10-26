import { describe, it, expect, beforeEach } from 'vitest';
import { ComplaintService } from '../services/complaint.service.js';

describe('Complaint Service & Accountability Lifecycle', () => {
  let complaintService: ComplaintService;

  beforeEach(() => {
    complaintService = new ComplaintService();
  });

  it('should create complaint and enforce citizen ownership isolation', async () => {
    const userA = 'usr_citizen_alice';
    const userB = 'usr_citizen_bob';

    const complaintA = await complaintService.createComplaint(
      {
        category: 'POTHOLE',
        title: 'Deep road crater in middle lane',
        description: 'Vehicles are swerving dangerously into oncoming traffic.',
        language: 'en',
        severity: 'HIGH',
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Central Secretariat, New Delhi',
        authorityId: 'auth_delhi_pwd_roads',
        photoStoragePath: 'evidence/pothole1.jpg',
        evidenceQualityRating: 'ACCEPTABLE',
        userConsentGranted: true,
        isAssistedDraft: false
      },
      userA
    );

    expect(complaintA.id).toBeDefined();
    expect(complaintA.userId).toBe(userA);

    // Alice can read her own complaint
    const fetchedByAlice = await complaintService.getComplaintById(complaintA.id, userA);
    expect(fetchedByAlice?.id).toBe(complaintA.id);

    // Bob cannot read Alice's complaint (enforces RLS / tenant boundary)
    await expect(complaintService.getComplaintById(complaintA.id, userB)).rejects.toThrow(
      'UNAUTHORIZED_ACCESS'
    );
  });

  it('should detect nearby duplicate complaints within 60 meters and same category', async () => {
    const user = 'usr_citizen_test';

    // Create existing complaint at lat 28.61390, lon 77.20900
    await complaintService.createComplaint(
      {
        category: 'GARBAGE_DUMP',
        title: 'Heaped waste near corner',
        description: 'Piles of rotten waste accumulating.',
        language: 'en',
        severity: 'MEDIUM',
        latitude: 28.61390,
        longitude: 77.20900,
        address: 'Sector 4 Corner, Delhi',
        authorityId: 'auth_delhi_mcd_sanitation',
        photoStoragePath: 'evidence/garbage.jpg',
        evidenceQualityRating: 'EXCELLENT',
        userConsentGranted: true,
        isAssistedDraft: false
      },
      user
    );

    // Check duplicate 25 meters away, same category
    const check1 = await complaintService.checkDuplicates({
      category: 'GARBAGE_DUMP',
      latitude: 28.61410,
      longitude: 77.20900,
      radiusMeters: 60,
      lookbackDays: 14
    });

    expect(check1.hasDuplicates).toBe(true);
    expect(check1.duplicates.length).toBe(1);
    expect(check1.duplicates[0].distanceMeters).toBeLessThan(60);

    // Check different category at same location -> no duplicate!
    const check2 = await complaintService.checkDuplicates({
      category: 'WATER_LEAKAGE',
      latitude: 28.61410,
      longitude: 77.20900,
      radiusMeters: 60,
      lookbackDays: 14
    });

    expect(check2.hasDuplicates).toBe(false);
  });

  it('should process resolution feedback, update dispute status, and record audit history', async () => {
    const user = 'usr_citizen_verify';

    const complaint = await complaintService.createComplaint(
      {
        category: 'WATER_LEAKAGE',
        title: 'Burst pipe flooding pedestrian pavement',
        description: 'Potable water gushing onto sidewalk.',
        language: 'en',
        severity: 'HIGH',
        latitude: 28.5672,
        longitude: 77.2100,
        address: 'South Extension, New Delhi',
        authorityId: 'auth_delhi_djb_water',
        photoStoragePath: 'evidence/water.jpg',
        evidenceQualityRating: 'EXCELLENT',
        userConsentGranted: true,
        isAssistedDraft: false
      },
      user
    );

    // Citizen disputes that the issue was actually resolved
    const feedback = await complaintService.submitFeedback(complaint.id, user, {
      citizenResolutionStatus: 'STILL_UNRESOLVED',
      satisfactionRating: 1,
      comments: 'Department claims resolved, but water is still leaking heavily.',
      disputeReason: 'Water pipe is still burst on ground inspection.'
    });

    expect(feedback.isDisputed).toBe(true);
    expect(feedback.satisfactionRating).toBe(1);

    // Verify complaint status transitioned to DISPUTED
    const updated = await complaintService.getComplaintById(complaint.id, user);
    expect(updated?.status).toBe('DISPUTED');

    // Verify audit history trail exists
    expect(updated?.history?.some(h => h.toStatus === 'DISPUTED')).toBe(true);

    // Prevent duplicate feedback submissions on the same complaint
    await expect(
      complaintService.submitFeedback(complaint.id, user, {
        citizenResolutionStatus: 'FULLY_RESOLVED',
        satisfactionRating: 5
      })
    ).rejects.toThrow('DUPLICATE_FEEDBACK');
  });
});

