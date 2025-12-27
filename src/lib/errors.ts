/**
 * Custom error classes and error handling utilities
 * Provides structured error handling with specific error types
 */

import { ERROR_MESSAGES } from './constants'

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Authentication error
 * Used for authentication-related failures
 */
export class AuthError extends AppError {
  constructor(message: string = ERROR_MESSAGES.AUTH.NOT_AUTHENTICATED, code?: string) {
    super(message, code, 401)
  }
}

/**
 * Validation error
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, 400)
  }
}

/**
 * NotFound error
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', code?: string) {
    super(message, code, 404)
  }
}

/**
 * Analysis error
 * Used for analysis-related failures
 */
export class AnalysisError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code, 500)
  }
}

/**
 * AI Service error
 * Used for AI service-related failures
 */
export class AIServiceError extends AppError {
  constructor(message: string = ERROR_MESSAGES.AI.FAILED_TO_ANALYZE, code?: string) {
    super(message, code, 500)
  }
}

/**
 * Database error
 * Used for database-related failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, code?: string, public readonly originalError?: unknown) {
    super(message, code, 500)
  }
}

/**
 * Cloudinary error
 * Used for Cloudinary upload-related failures
 */
export class CloudinaryError extends AppError {
  constructor(message: string = 'Failed to upload image to Cloudinary', code?: string, public readonly originalError?: unknown) {
    super(message, code, 500)
  }
}

/**
 * Check if an error is an instance of AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Get user-friendly error message
 * Extracts a user-friendly message from various error types
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  if (isAppError(error)) {
    return `[${error.name}] ${error.message}${error.code ? ` (code: ${error.code})` : ''}`
  }

  if (error instanceof Error) {
    return `[Error] ${error.message}${error.stack ? `\n${error.stack}` : ''}`
  }

  return `[Unknown Error] ${String(error)}`
}


