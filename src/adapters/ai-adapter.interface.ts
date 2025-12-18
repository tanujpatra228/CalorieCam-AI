/**
 * AI Adapter Interface
 * Defines the contract for all AI provider implementations
 */

export interface AnalyzeImageParams {
  imageData: string
  prompt: string
}

export interface AIAdapter {
  /**
   * Analyzes an image using the AI provider
   * @param params - Image data and prompt for analysis
   * @returns The analysis result as a string (JSON format)
   * @throws {Error} If the analysis fails
   */
  analyzeImage(params: AnalyzeImageParams): Promise<string>

  /**
   * Gets the name of the AI provider
   */
  getProviderName(): string
}

