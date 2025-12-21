/**
 * Application-wide constants
 * Centralized location for all magic values, routes, and configuration constants
 */

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/protected/reset-password',
  AUTH_CALLBACK: '/auth/callback',
  PROTECTED: '/protected',
  PROTECTED_ANALYSIS_HISTORY: '/protected/analysis-history',
  PROTECTED_PROFILE: '/protected/profile',
  CAMERA: '/camera',
  LOGIN: '/login',
} as const

/**
 * AI Service configuration
 */
export const AI_CONFIG = {
  MODEL_NAME: 'gemini-2.5-flash',
  IMAGE_MIME_TYPE: 'image/jpeg',
  IMAGE_FORMAT: 'jpeg',
} as const

/**
 * Validation limits for user inputs
 */
export const VALIDATION_LIMITS = {
  HEIGHT: {
    MIN: 100,
    MAX: 250,
  },
  WEIGHT: {
    MIN: 30,
    MAX: 300,
  },
  CALORIES: {
    MIN: 1000,
    MAX: 5000,
  },
  PROTEIN: {
    MIN: 20,
    MAX: 300,
  },
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  AUTH: {
    NOT_AUTHENTICATED: 'Not authenticated',
    USER_MUST_BE_LOGGED_IN: 'User must be logged in',
    AUTHENTICATION_REQUIRED: 'Please sign in to log your analysis.',
    FAILED_TO_LOAD_PROFILE: 'Failed to load profile. Please try again.',
    FAILED_TO_SAVE_PROFILE: 'Failed to save profile. Please try again.',
  },
  ANALYSIS: {
    FAILED_TO_LOG: 'Failed to log analysis. Please try again.',
    FAILED_TO_FETCH_LOGS: 'Failed to fetch analysis logs',
    USER_MUST_BE_LOGGED_IN_TO_LOG: 'User must be logged in to log analysis',
    USER_MUST_BE_LOGGED_IN_TO_VIEW: 'User must be logged in to view analysis logs',
  },
  AI: {
    FAILED_TO_ANALYZE: 'Failed to analyze image',
    FAILED_TO_PARSE_RESULT: 'Failed to parse analysis result',
  },
  CAMERA: {
    FAILED_TO_ACCESS: 'Failed to access camera',
    INVALID_FILE_TYPE: 'Please select an image file',
  },
  VALIDATION: {
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',
    EMAIL_AND_PASSWORD_REQUIRED: 'Email and password are required',
    PASSWORDS_DO_NOT_MATCH: 'Passwords do not match',
    PASSWORD_AND_CONFIRM_REQUIRED: 'Password and confirm password are required',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'An unexpected error occurred',
    TRY_AGAIN: 'Please try again',
  },
} as const

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  AUTH: {
    SIGN_UP_SUCCESS: 'Thanks for signing up! Please check your email for a verification link.',
    PASSWORD_RESET_SENT: 'Check your email for a link to reset your password.',
    PASSWORD_UPDATED: 'Password updated',
  },
  ANALYSIS: {
    LOGGED_SUCCESSFULLY: 'Analysis logged successfully!',
  },
  PROFILE: {
    UPDATED: 'Profile updated successfully',
    UPDATE_TO_GET_STARTED: 'Update your profile to get started.',
  },
} as const

/**
 * Toast message titles
 */
export const TOAST_TITLES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  NOTE: 'Note',
  AUTHENTICATION_REQUIRED: 'Authentication Required',
} as const


