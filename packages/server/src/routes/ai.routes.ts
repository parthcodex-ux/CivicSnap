import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { aiService } from '../services/ai.service.js';
import { AnalyzeImageRequestSchema } from '@civicsnap/shared';

export const aiRouter = Router();

aiRouter.post('/analyze-image', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'IMAGE_REQUIRED',
          message: 'An image file (photo) is required for AI complaint analysis.'
        }
      });
    }

    // Parse and validate query/body parameters
    const parsedParams = AnalyzeImageRequestSchema.safeParse({
      userDescription: req.body.userDescription,
      preferredLanguage: req.body.preferredLanguage,
      latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
      longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined
    });

    if (!parsedParams.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid request parameters',
          details: parsedParams.error.format()
        }
      });
    }

    const { userDescription, preferredLanguage, latitude, longitude } = parsedParams.data;

    const analysis = await aiService.analyzeComplaintImage({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      userDescription,
      preferredLanguage,
      latitude,
      longitude
    });

    return res.json({
      success: true,
      data: analysis
    });
  } catch (err) {
    next(err);
  }
});
