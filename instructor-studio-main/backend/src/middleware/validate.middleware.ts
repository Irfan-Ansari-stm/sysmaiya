import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const err = result.error;
      return next(err); // Let ZodError handler in errorHandler deal with it
    }
    req[source] = result.data;
    next();
  };
};
