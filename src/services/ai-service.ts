'use server'

import { IMG_ANALYZE_PROMPT } from '@/lib/constants'
import { AIAdapterFactory } from '@/adapters/ai-adapter.factory'
import { AIServiceError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'
import { validateInput } from '@/lib/validation'
import { analyzeImageSchema } from '@/lib/validation-schemas'

/**
 * Analyzes an image using the configured AI provider
 * @param imageData - Base64 encoded image data (with or without data URL prefix)
 * @param additionalContext - Optional additional context for the analysis
 * @returns The analysis result as a string (JSON format)
 * @throws {AIServiceError} If the analysis fails
 */
export async function analyzeImage(
  imageData: string,
  additionalContext?: string,
): Promise<string> {
  validateInput(analyzeImageSchema, { imageData, additionalContext })
  
  try {
    const adapter = AIAdapterFactory.getAdapter()
    const prompt = getAnalyzePrompt(additionalContext)

    const result = await adapter.analyzeImage({
      imageData,
      prompt,
    })

    return result
  } catch (error) {
    const errorMessage = formatErrorForLogging(error)
    console.error('Error analyzing image:', errorMessage)
    throw new AIServiceError('Failed to analyze image')
  }
}

/**
 * Gets the analysis prompt with optional additional context
 * @param additionalContext - Optional additional context to include in the prompt
 * @returns The formatted prompt string
 */
function getAnalyzePrompt(additionalContext?: string): string {
  return IMG_ANALYZE_PROMPT.replaceAll(
    '{{additionalContext}}',
    additionalContext || 'N/A',
  )
}


