/**
 * Validation schemas for server-side input validation
 * Uses Zod for type-safe validation
 */

import { z } from 'zod'
import { VALIDATION_LIMITS } from './constants'

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .trim()

/**
 * Password validation schema
 */
const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password is too long')

/**
 * ISO date string validation schema (YYYY-MM-DD format)
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(
    (date) => {
      const parsed = new Date(date)
      return !isNaN(parsed.getTime())
    },
    { message: 'Invalid date' }
  )

/**
 * URL validation schema
 */
const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(2048, 'URL is too long')

/**
 * Base64 image data validation schema
 */
const base64ImageSchema = z
  .string()
  .min(1, 'Image data is required')
  .refine(
    (data) => {
      const base64Data = data.includes(',') ? data.split(',')[1] : data
      return /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)
    },
    { message: 'Invalid base64 image data' }
  )

/**
 * Additional context validation schema
 */
const additionalContextSchema = z
  .string()
  .max(1000, 'Additional context is too long')
  .optional()

/**
 * Auth validation schemas
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

/**
 * Macro data validation schema
 */
const macroDataSchema = z.object({
  calories_kcal: z.number().min(0).max(10000),
  carbs_g: z.number().min(0).max(2000),
  sugars_g: z.number().min(0).max(1000),
  protein_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(1000),
  sat_fat_g: z.number().min(0).max(500),
  fiber_g: z.number().min(0).max(200),
})

/**
 * Micro data validation schema
 */
const microDataSchema = z.object({
  sodium_mg: z.number().min(0).max(50000).nullable(),
  vitaminC_mg: z.number().min(0).max(1000).nullable(),
})

/**
 * Analysis data validation schema
 */
export const analysisDataSchema = z.object({
  dish_name: z
    .string()
    .min(1, 'Dish name is required')
    .max(200, 'Dish name is too long')
    .trim(),
  total_weight_g: z.number().min(1).max(10000),
  total_digestion_time_m: z.number().min(0).max(1440), // Max 24 hours
  total_calories_to_digest_kcal: z.number().min(0).max(5000).nullable(),
  macros: macroDataSchema,
  micros: microDataSchema,
  notes: z.array(z.string().max(500)).max(20), // Max 20 notes, each max 500 chars
})

/**
 * Log analysis validation schema
 */
export const logAnalysisSchema = z.object({
  analysisData: analysisDataSchema,
  imageUrl: urlSchema,
})

/**
 * Get analysis logs by date validation schema
 */
export const getAnalysisLogsByDateSchema = z.object({
  date: isoDateSchema,
})

/**
 * Profile form data validation schema
 */
export const profileFormDataSchema = z.object({
  height_cm: z
    .number()
    .min(VALIDATION_LIMITS.HEIGHT.MIN)
    .max(VALIDATION_LIMITS.HEIGHT.MAX)
    .optional(),
  weight_kg: z
    .number()
    .min(VALIDATION_LIMITS.WEIGHT.MIN)
    .max(VALIDATION_LIMITS.WEIGHT.MAX)
    .optional(),
  activity_level: z
    .enum(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .optional(),
  goal: z.enum(['lose_weight', 'maintain', 'gain_muscle']).optional(),
  daily_calories_budget: z
    .number()
    .min(VALIDATION_LIMITS.CALORIES.MIN)
    .max(VALIDATION_LIMITS.CALORIES.MAX)
    .optional(),
  daily_protein_target_g: z
    .number()
    .min(VALIDATION_LIMITS.PROTEIN.MIN)
    .max(VALIDATION_LIMITS.PROTEIN.MAX)
    .optional(),
})

/**
 * Analyze image validation schema
 */
export const analyzeImageSchema = z.object({
  imageData: base64ImageSchema,
  additionalContext: additionalContextSchema,
})

