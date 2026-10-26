import { Router } from 'express';
import { authorityService } from '../services/authority.service.js';
import { ResolveAuthorityRequestSchema } from '@civicsnap/shared';

export const authorityRouter = Router();

// List all verified authorities
authorityRouter.get('/', (req, res) => {
  const list = authorityService.getAllAuthorities();
  return res.json({
    success: true,
    data: list
  });
});

// Resolve best authority based on GPS coords and issue category
authorityRouter.post('/resolve', (req, res, next) => {
  try {
    const validated = ResolveAuthorityRequestSchema.parse(req.body);
    const resolution = authorityService.resolveAuthority({
      category: validated.category,
      latitude: validated.latitude,
      longitude: validated.longitude,
      addressText: validated.addressText
    });

    return res.json({
      success: true,
      data: resolution
    });
  } catch (err) {
    next(err);
  }
});
