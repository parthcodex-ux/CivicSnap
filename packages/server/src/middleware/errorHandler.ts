import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiErrorResponse } from '@civicsnap/shared';

export function errorHandler(
  err: any,
  req: Request,
  res: Response<ApiErrorResponse>,
  next: NextFunction
) {
  console.error('Unhandled Application Error:', err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: err.format()
      }
    });
  }

  // 2. Multer file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: err.message
      }
    });
  }

  // 3. Unauthorized
  if (err.message && err.message.startsWith('UNAUTHORIZED_ACCESS')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: err.message
      }
    });
  }

  // 4. Duplicate
  if (err.message && err.message.startsWith('DUPLICATE_FEEDBACK')) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: err.message
      }
    });
  }

  // 5. Default Internal Server Error
  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred. Please try again.'
    }
  });
}
