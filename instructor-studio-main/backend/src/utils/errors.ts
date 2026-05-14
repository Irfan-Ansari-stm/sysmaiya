import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }
  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }
  static conflict(message: string) {
    return new AppError(message, 409, 'CONFLICT');
  }
  static unprocessable(message: string) {
    return new AppError(message, 422, 'UNPROCESSABLE');
  }
  static tooManyRequests(message = 'Too many requests') {
    return new AppError(message, 429, 'RATE_LIMITED');
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
      },
    });
  }

  // Postgres errors
  if ((err as any).code === '23505') {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'Resource already exists' },
    });
  }
  if ((err as any).code === '23503') {
    return res.status(400).json({
      error: { code: 'REFERENCE_ERROR', message: 'Referenced resource not found' },
    });
  }

  // Operational errors (AppError)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Unknown errors
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    },
  });
}
