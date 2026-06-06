import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
}

/**
 * Helper to create an error with a status code.
 */
export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  return error;
}
