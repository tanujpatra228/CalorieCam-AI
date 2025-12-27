/**
 * Validation utility functions
 * Provides helper functions for validating inputs using Zod schemas
 */

import { ZodSchema, ZodError } from 'zod'
import { ValidationError } from './errors'

/**
 * Validates input data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 */
export function validateInput<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      const message = firstError?.message || 'Validation failed'
      throw new ValidationError(message, firstError?.path?.join('.') || 'unknown')
    }
    throw new ValidationError('Validation failed', 'unknown')
  }
}

/**
 * Validates FormData against a Zod schema
 * @param schema - Zod schema to validate against
 * @param formData - FormData to validate
 * @returns Validated and typed data
 * @throws {ValidationError} If validation fails
 */
export function validateFormData<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  formData: FormData
): T {
  const data: Record<string, unknown> = {}

  for (const [key, value] of Array.from(formData.entries())) {
    // Convert string values to appropriate types
    // For now, keep as string - Zod will handle type conversion
    data[key] = value
  }

  return validateInput(schema, data)
}

/**
 * Sanitizes a string input to prevent XSS attacks
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
}

/**
 * Validates and sanitizes email input
 * @param email - Email to validate and sanitize
 * @returns Sanitized email
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

