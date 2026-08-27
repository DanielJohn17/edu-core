import { Response } from "express";

export class AppError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]> | undefined;

  constructor(
    message: string,
    statusCode = 400,
    errors?: Record<string, string[]> | undefined,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const getPagination = (query: { page?: number | string; limit?: number | string }): PaginationParams => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number,
  extra?: Record<string, unknown>,
) => {
  return res.status(200).json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    ...(extra || {}),
  });
};
