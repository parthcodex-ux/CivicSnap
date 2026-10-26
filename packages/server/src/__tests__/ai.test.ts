import { describe, it, expect } from 'vitest';
import { AIService } from '../services/ai.service.js';
import { AIAnalysisResultSchema } from '@civicsnap/shared';

describe('AI Gemma 4 Service & Vision Validation', () => {
  const aiService = new AIService();

  it('should generate valid structured analysis for pothole image', async () => {
    // 1x1 test pixel buffer
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const result = await aiService.analyzeComplaintImage({
      imageBuffer: mockImageBuffer,
      mimeType: 'image/png',
      userDescription: 'Dangerous crater pothole on main carriageway',
      preferredLanguage: 'en'
    });

    // Validate with strict Zod schema
    const validated = AIAnalysisResultSchema.parse(result);
    expect(validated.issueCategory).toBe('POTHOLE');
    expect(validated.severity).toBe('HIGH');
    expect(validated.proposedDraft.title).toBeDefined();
    expect(validated.proposedDraft.bodyEn).toBeDefined();
    expect(validated.proposedDraft.bodyHi).toBeDefined();
    expect(validated.evidenceQuality.rating).toBe('ACCEPTABLE');
    expect(validated.uncertainties.length).toBeGreaterThan(0);
  });

  it('should categorize garbage dump correctly and provide Hindi draft', async () => {
    const mockImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const result = await aiService.analyzeComplaintImage({
      imageBuffer: mockImageBuffer,
      mimeType: 'image/png',
      userDescription: 'Rotten garbage and waste overflowing from bin',
      preferredLanguage: 'hi'
    });

    expect(result.issueCategory).toBe('GARBAGE_DUMP');
    expect(result.proposedDraft.bodyHi).toContain('कचरा');
  });
});

