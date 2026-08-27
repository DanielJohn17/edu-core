import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";

export const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "global";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
};

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstErrorMessage =
        result.error.issues[0]?.message || "Validation failed";
      return res.status(400).json({
        message: firstErrorMessage,
        error: firstErrorMessage,
        errors,
      });
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.query);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstErrorMessage =
        result.error.issues[0]?.message || "Invalid query parameters";
      return res.status(400).json({
        message: firstErrorMessage,
        error: firstErrorMessage,
        errors,
      });
    }
    req.query = result.data as any;
    next();
  };
};

export const validateParams = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = await schema.safeParseAsync(req.params);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const firstErrorMessage =
        result.error.issues[0]?.message || "Invalid route parameters";
      return res.status(400).json({
        message: firstErrorMessage,
        error: firstErrorMessage,
        errors,
      });
    }
    req.params = result.data as any;
    next();
  };
};
