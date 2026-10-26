import { Router } from 'express';

export const mockAuthorityRouter = Router();

mockAuthorityRouter.post('/receive', (req, res) => {
  const { category, title, location } = req.body;
  const receiptId = `MOCK-BBMP-API-${Date.now().toString(36).toUpperCase()}`;

  console.log(`[Municipal Sandbox Gateway] Received complaint: ${title} (${category}) at [${location?.latitude}, ${location?.longitude}]`);

  return res.status(201).json({
    status: 'ACCEPTED',
    referenceId: receiptId,
    timestamp: new Date().toISOString(),
    assignedZone: 'Central Operations Cell',
    slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    acknowledgement: 'Your civic grievance has been officially queued in the municipal direct dispatch roster.'
  });
});

