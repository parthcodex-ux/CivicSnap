import { describe, it, expect } from 'vitest';
import {
  IssueCategoryEnum,
  AIAnalysisResultSchema,
  CreateComplaintRequestSchema,
  ResolutionFeedbackRecordSchema
} from '../src/index.js';

describe('Shared Schema Contracts', () => {
  it('should validate valid issue categories', () => {
    expect(IssueCategoryEnum.parse('POTHOLE')).toBe('POTHOLE');
    expect(IssueCategoryEnum.parse('GARBAGE_DUMP')).toBe('GARBAGE_DUMP');
    expect(() => IssueCategoryEnum.parse('INVALID_CAT')).toThrow();
  });

  it('should enforce citizen consent when creating complaint', () => {
    const validData = {
      category: 'WATER_LEAKAGE',
      title: 'Main pipeline burst near metro gate 2',
      description: 'Clean drinking water gushing onto the road since morning, flooding the footpath.',
      language: 'en',
      severity: 'HIGH',
      latitude: 28.6139,
      longitude: 77.2090,
      address: 'Near Central Secretariat Metro Gate 2, New Delhi',
      authorityId: 'auth_delhi_djb',
      photoStoragePath: 'complaints/user123/img.jpg',
      evidenceQualityRating: 'EXCELLENT',
      userConsentGranted: true
    };

    expect(() => CreateComplaintRequestSchema.parse(validData)).not.toThrow();

    const withoutConsent = {
      ...validData,
      userConsentGranted: false
    };
    expect(() => CreateComplaintRequestSchema.parse(withoutConsent)).toThrow();
  });

  it('should validate complete AI analysis output shape', () => {
    const sampleAIResult = {
      issueCategory: 'POTHOLE',
      conciseDescription: 'Deep circular pothole visible in active traffic lane.',
      severity: 'HIGH',
      severityExplanation: 'Exceeds 15cm depth, posing immediate hazard to two-wheelers.',
      visibleEvidence: ['Asphalt breakdown', 'Exposed gravel aggregate', 'Puddle accumulation'],
      uncertainties: ['Exact depth cannot be confirmed from top-down camera angle'],
      confidenceScore: 0.94,
      confidenceLabel: 'HIGH',
      missingInformation: ['Exact street landmark or house number'],
      proposedDraft: {
        title: 'Hazardous deep pothole on active roadway',
        bodyEn: 'There is a dangerous deep pothole that requires urgent patching to prevent vehicular accidents.',
        bodyHi: 'सड़क पर एक गहरा और खतरनाक गड्ढा है जिसे दुर्घटनाओं से बचने के लिए तत्काल मरम्मत की आवश्यकता है।',
        urgencyRationale: 'Heavy vehicular traffic and high risk of two-wheeler skidding.'
      },
      evidenceQuality: {
        rating: 'EXCELLENT',
        isBlurry: false,
        isNightTime: false,
        issueClearlyVisible: true,
        recommendations: []
      },
      analyzedAt: new Date().toISOString(),
      modelName: 'gemma-4-26b-it'
    };

    const parsed = AIAnalysisResultSchema.parse(sampleAIResult);
    expect(parsed.issueCategory).toBe('POTHOLE');
    expect(parsed.confidenceLabel).toBe('HIGH');
  });
});
