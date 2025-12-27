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
  FALLBACK_MODELS: ['gemini-pro', 'gemini-1.5-pro-001'],
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY_MS: 1000,
  RETRY_DELAY_MULTIPLIER: 2,
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
 * Image compression configuration
 */
export const IMAGE_COMPRESSION = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
  JPEG_QUALITY: 0.8,
  MAX_FILE_SIZE_BYTES: 800 * 1024, // 800KB target
  MIN_QUALITY: 0.3,
  QUALITY_STEP: 0.1,
} as const

/**
 * Profile calculation constants
 */
export const PROFILE_CALCULATION = {
  DEFAULT_AGE: 30,
  MIN_CALORIES_BUDGET: 1000,
  ACTIVITY_MULTIPLIERS: {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  } as const,
  GOAL_ADJUSTMENTS: {
    lose_weight: -500,
    maintain: 0,
    gain_muscle: 300,
  } as const,
  PROTEIN_MULTIPLIERS: {
    lose_weight: 2.2,
    maintain: 1.6,
    gain_muscle: 2.0,
  } as const,
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

/**
 * AI Image Analysis Prompt
 * System prompt for food recognition and nutrition analysis
 */
export const IMG_ANALYZE_PROMPT = `SYSTEM:
You are world-class food recognition and nutrition analysis engine. Your mission: when given a photo of a dish, you must:

1. Identify the dish or its components.
2. Estimate total weight (in grams) of the visible food.
3. Estimate total digestion time (in minutes) of the visible food.
4. Estimate total Calories required to digest the visible food.
5. Calculate macronutrients:
   • Calories (kcal)
   • Carbohydrates (g) – include sugars
   • Protein (g)
   • Fat (g) – include saturated fat
   • Fiber (g)
6. Optionally, list key micronutrients if clearly discernible (e.g. sodium, vitamin C).
7. Return results in the exact JSON schema below—no extra commentary only if food is detected else just say "NO".

REQUIREMENTS:
– Always assume "medium" portion size if dish type is generic (e.g., "pasta") and note this assumption in an internal "notes" field.
– If any component cannot be confidently identified, set its value to 'null' and add a "notes" entry explaining why.
- Always add the bioavailability of protein in the individual component of the meal in "notes".
- In the "notes" field, mention the identified component of the meal that is controbuting most to the total calories.
– Round all numeric values to one decimal place.

Additional User Provided Context:
{{additionalContext}}

OUTPUT JSON SCHEMA:
{
  "dish_name":       "string",        // e.g. "Chicken Alfredo Pasta"
  "total_weight_g":  number,          // in grams
  "total_digestion_time_m":  number,          // in minutes
  "total_calories_to_digest_kcal":  number,          // in kcal
  "macros": {
    "calories_kcal": number,
    "carbs_g":       number,
    "sugars_g":      number,
    "protein_g":     number,
    "fat_g":         number,
    "sat_fat_g":     number,
    "fiber_g":       number
  },
  "micros": {                          // optional
    "sodium_mg":    number|null,
    "vitaminC_mg":  number|null
  },
  "notes":         [ "string", ... ]   // any assumption or uncertainty
}
`


