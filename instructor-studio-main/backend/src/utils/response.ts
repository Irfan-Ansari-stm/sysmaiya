import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, statusCode = 200, meta?: any) => {
  const payload: any = { data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

export const sendCreated = (res: Response, data: any) => sendSuccess(res, data, 201);

export const sendPaginated = (
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
) => {
  return res.status(200).json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
};

export const paginate = (query: any) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};
