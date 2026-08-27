import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/api";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Unhandled Error:", err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      error: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
  }

  // PostgreSQL Unique constraint violation
  if (err?.code === "23505") {
    const detail = err.detail || "A record with this value already exists";
    return res.status(409).json({
      message: detail,
      error: detail,
    });
  }

  // PostgreSQL Foreign key constraint violation
  if (err?.code === "23503") {
    const detail = err.detail || "Referenced resource constraint violation";
    return res.status(409).json({
      message: detail,
      error: detail,
    });
  }

  // Fallback 500
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err?.message || "Internal server error";

  return res.status(500).json({
    message,
    error: message,
  });
};
