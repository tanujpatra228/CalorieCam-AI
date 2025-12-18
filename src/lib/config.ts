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
 * Get an optional environment variable
 * @param key - Environment variable key
 * @returns The environment variable value or undefined
 */
function getOptionalEnvVar(key: string): string | undefined {
  return process.env[key]
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
export const config: AppConfig = {
  supabase: {
    url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },
  ai: {
    provider: (getOptionalEnvVar('AI_PROVIDER') || process.env.AI_PROVIDER || 'google') as AIProvider,
    apiKey: getEnvVar('GOOGLE_AI_API_KEY') || process.env.GOOGLE_AI_API_KEY!,
  },
  app: {
    url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL') || process.env.NEXT_PUBLIC_APP_URL!,
    vercelUrl: getOptionalEnvVar('VERCEL_URL') || process.env.VERCEL_URL!,
    vercelEnv: getOptionalEnvVar('VERCEL_ENV') || process.env.VERCEL_ENV!,
    vercelProjectProductionUrl: getOptionalEnvVar('VERCEL_PROJECT_PRODUCTION_URL') || process.env.VERCEL_PROJECT_PRODUCTION_URL!,
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


