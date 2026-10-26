import { Router } from 'express';
import { complaintService } from '../services/complaint.service.js';

export const analyticsRouter = Router();

analyticsRouter.get('/resolution', async (req, res, next) => {
  try {
    const stats = await complaintService.getResolutionAnalytics();
    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
});

