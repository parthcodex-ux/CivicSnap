import { Router } from 'express';
import { complaintService } from '../services/complaint.service.js';
import { storageService } from '../services/storage.service.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  CreateComplaintRequestSchema,
  NearbyDuplicateQuerySchema,
  SubmitFeedbackRequestSchema
} from '@civicsnap/shared';

export const complaintRouter = Router();

// Upload evidence photo directly to private Supabase storage
complaintRouter.post('/upload-evidence', authenticate, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_REQUIRED',
          message: 'An image file is required for evidence upload'
        }
      });
    }

    const userId = req.user!.id;
    const complaintId = (req.body.complaintId as string) || 'temp';
    const isResolutionProof = req.body.isResolutionProof === 'true';
    const ext = req.file.mimetype.split('/')[1] || 'jpg';

    const result = await storageService.uploadEvidence({
      userId,
      complaintId,
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      fileExtension: ext,
      isResolutionProof
    });

    return res.status(201).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 1. Duplicate check endpoint
complaintRouter.post('/check-duplicates', async (req, res, next) => {
  try {
    const validated = NearbyDuplicateQuerySchema.parse(req.body);
    const result = await complaintService.checkDuplicates(validated);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

// 2. Create complaint (Authenticated)
complaintRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const validated = CreateComplaintRequestSchema.parse(req.body);
    const userId = req.user!.id;
    const complaint = await complaintService.createComplaint(validated, userId);

    return res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get all user complaints (Authenticated & Tenant Isolated)
complaintRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const complaints = await complaintService.getUserComplaints(userId);
    return res.json({
      success: true,
      data: complaints
    });
  } catch (err) {
    next(err);
  }
});

// 4. Get complaint by ID with ownership verification
complaintRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const complaint = await complaintService.getComplaintById(req.params.id, userId);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMPLAINT_NOT_FOUND',
          message: `Complaint with id ${req.params.id} does not exist.`
        }
      });
    }

    return res.json({
      success: true,
      data: complaint
    });
  } catch (err) {
    next(err);
  }
});

// 5. Submit Citizen Feedback & Accountability Review
complaintRouter.post('/:id/feedback', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const validated = SubmitFeedbackRequestSchema.parse(req.body);
    const feedback = await complaintService.submitFeedback(req.params.id, userId, validated);

    return res.json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
});

