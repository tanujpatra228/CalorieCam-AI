import { AIAdapter } from './ai-adapter.interface'
import { GoogleAIAdapter } from './google-ai.adapter'
// Uncomment when ready to use:
// import { OpenAIAdapter } from './openai.adapter'
// import { AnthropicAdapter } from './anthropic.adapter'
import { getAIProvider } from '@/lib/config'

/**
 * AI Adapter Factory
 * Creates and returns the appropriate AI adapter based on configuration
 */
export class AIAdapterFactory {
  private static adapter: AIAdapter | null = null

  /**
   * Gets the configured AI adapter instance
   * Uses singleton pattern to ensure only one instance is created
   */
  static getAdapter(): AIAdapter {
    if (this.adapter) {
      return this.adapter
    }

    const provider = getAIProvider()

    switch (provider) {
      case 'google':
        this.adapter = new GoogleAIAdapter()
        break
      // Uncomment when ready to use:
      // case 'openai':
      //   this.adapter = new OpenAIAdapter()
      //   break
      // case 'anthropic':
      //   this.adapter = new AnthropicAdapter()
      //   break
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }

    return this.adapter
  }

  /**
   * Resets the adapter instance (useful for testing)
   */
  static reset(): void {
    this.adapter = null
  }
}

