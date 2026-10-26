import { describe, it, expect } from 'vitest';
import { AuthorityService, DirectApiAdapter, AssistedPortalAdapter } from '../services/authority.service.js';

describe('Authority Resolution & Provider Adapters', () => {
  const service = new AuthorityService();

  it('should resolve Delhi water leak to Delhi Jal Board (DJB)', () => {
    const res = service.resolveAuthority({
      category: 'WATER_LEAKAGE',
      latitude: 28.5672,
      longitude: 77.2100,
      addressText: 'South Extension, New Delhi'
    });

    expect(res.authority.id).toBe('auth_delhi_djb_water');
    expect(res.submissionMode).toBe('ASSISTED_PORTAL');
    expect(res.matchingExplanation).toContain('Delhi Jal Board');
    expect(res.portalGuidance?.directUrl).toContain('djb.gov.in');
  });

  it('should resolve Bengaluru pothole to BBMP', () => {
    const res = service.resolveAuthority({
      category: 'POTHOLE',
      latitude: 12.9352,
      longitude: 77.6245,
      addressText: 'Koramangala, Bengaluru'
    });

    expect(res.authority.id).toBe('auth_bbmp_bengaluru');
    expect(res.submissionMode).toBe('ASSISTED_PORTAL');
    expect(res.matchingExplanation).toContain('BBMP');
  });

  it('should resolve Delhi arterial road potholes to Delhi PWD', () => {
    const res = service.resolveAuthority({
      category: 'POTHOLE',
      latitude: 28.6139,
      longitude: 77.2090,
      addressText: 'Rajpath, New Delhi'
    });

    expect(res.authority.id).toBe('auth_delhi_pwd_roads');
    expect(res.matchingExplanation).toContain('Public Works Department');
  });

  it('should format clean grievance dossier in AssistedPortalAdapter without fabricating receipts', async () => {
    const auth = service.getAuthority('auth_delhi_mcd_sanitation')!;
    const adapter = new AssistedPortalAdapter(auth);

    const result = await adapter.submitComplaint({
      complaintId: 'test_123',
      category: 'GARBAGE_DUMP',
      title: 'Overflowing garbage bin near market',
      description: 'Solid waste is spilling onto the pedestrian pathway.',
      latitude: 28.6448,
      longitude: 77.2167,
      address: 'Ajmeri Gate, Delhi'
    });

    expect(result.isSuccess).toBe(true);
    expect(result.mode).toBe('ASSISTED_PORTAL');
    expect(result.receiptReferenceId).toBeUndefined(); // Never fabricate reference ID!
    expect(result.portalGuidance?.formattedDossier).toContain('[CIVIC GRIEVANCE DOSSIER]');
    expect(result.portalGuidance?.portalUrl).toBe('https://mcdonline.nic.in/citizen/');
  });
});
