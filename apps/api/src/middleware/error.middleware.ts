import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

export interface AppError extends Error {
  statusCode?: number
  code?: string
}

export function errorMiddleware(
  err: AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors[0]?.message ?? 'Validation failed',
      },
    })
    return
  }

  const statusCode = err.statusCode ?? 500
  const code = err.code ?? 'INTERNAL_ERROR'
  res.status(statusCode).json({ success: false, error: { code, message: err.message } })
}

export function createError(message: string, statusCode: number, code: string): AppError {
  const err: AppError = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}
