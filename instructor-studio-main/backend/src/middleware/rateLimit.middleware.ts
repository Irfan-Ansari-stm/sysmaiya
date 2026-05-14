import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AppError } from '../utils/errors';

const handler = (_req: Request, _res: Response) => {
  throw AppError.tooManyRequests('Too many requests, please try again later');
};

export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => req.ip === '127.0.0.1',
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  keyGenerator: (req) => req.ip + ':' + req.body?.email,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  handler,
});
