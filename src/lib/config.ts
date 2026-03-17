/**
 * Centralized configuration management
 * Provides type-safe access to environment variables with validation
 */

/**
 * Get an environment variable with optional default value
 * @param key - Environment variable key
 * @param defaultValue - Optional default value if env var is not set
 * @returns The environment variable value or default
 */
function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue ?? '';
  return value as string;
}


/**
 * Supported AI providers
 */
export type AIProvider = 'google' | 'openai' | 'anthropic'

/**
 * Application configuration interface
 */
export interface AppConfig {
  supabase: {
    url: string
    anonKey: string
  }
  ai: {
    provider: AIProvider
    apiKey: string
  }
  cloudinary: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
  app: {
    url?: string
    vercelUrl?: string
    vercelEnv?: string
    vercelProjectProductionUrl?: string
  }
}

/**
 * Validated application configuration
 * All required environment variables are validated at module load time
 */
/**
 * Validated application configuration
 *
 * IMPORTANT: NEXT_PUBLIC_* env vars must use dot-notation access
 * (e.g. process.env.NEXT_PUBLIC_SUPABASE_URL) because Next.js/webpack
 * inlines them at build time only via static dot-notation — dynamic
 * bracket access like process.env[key] returns undefined on the client.
 * Server-only vars (no NEXT_PUBLIC_ prefix) can use getEnvVar() safely.
 */
export const config: AppConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'google') as AIProvider,
    apiKey: getEnvVar('GOOGLE_AI_API_KEY'),
  },
  cloudinary: {
    cloudName: getEnvVar('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnvVar('CLOUDINARY_API_KEY'),
    apiSecret: getEnvVar('CLOUDINARY_API_SECRET'),
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL,
    vercelUrl: process.env.VERCEL_URL,
    vercelEnv: process.env.VERCEL_ENV,
    vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  },
}

/**
 * Helper to get Supabase URL
 */
export function getSupabaseUrl(): string {
  return config.supabase.url
}

/**
 * Helper to get Supabase anon key
 */
export function getSupabaseAnonKey(): string {
  return config.supabase.anonKey
}

/**
 * Helper to get Google AI API key
 */
export function getGoogleAiApiKey(): string {
  return config.ai.apiKey
}

/**
 * Helper to get the configured AI provider
 */
export function getAIProvider(): AIProvider {
  return config.ai.provider
}

/**
 * Helper to get app URL with fallback
 */
export function getAppUrl(): string {
  if (config.app.url) {
    return config.app.url
  }
  if (config.app.vercelUrl) {
    return `https://${config.app.vercelUrl}`
  }
  return 'http://localhost:3000'
}

/**
 * Helper to get Cloudinary cloud name
 */
export function getCloudinaryCloudName(): string {
  return config.cloudinary.cloudName
}

/**
 * Helper to get Cloudinary API key
 */
export function getCloudinaryApiKey(): string {
  return config.cloudinary.apiKey
}

/**
 * Helper to get Cloudinary API secret
 */
export function getCloudinaryApiSecret(): string {
  return config.cloudinary.apiSecret
}


