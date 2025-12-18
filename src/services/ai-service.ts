'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { IMG_ANALYZE_PROMPT } from '@/lib/consts'
import { getGoogleAiApiKey } from '@/lib/config'
import { AI_CONFIG } from '@/lib/constants'
import { AIServiceError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(getGoogleAiApiKey())

/**
 * Analyzes an image using Google Generative AI
 * @param imageData - Base64 encoded image data (with or without data URL prefix)
 * @param additionalContext - Optional additional context for the analysis
 * @returns The analysis result as a string (JSON format)
 * @throws {AIServiceError} If the analysis fails
 */
export async function analyzeImage(
  imageData: string,
  additionalContext?: string,
): Promise<string> {
  try {
    const base64Data = imageData.includes(',')
      ? imageData.split(',')[1]
      : imageData

    // Initialize the model
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL_NAME })

    // Create image part
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: AI_CONFIG.IMAGE_MIME_TYPE,
      },
    }

    // Generate content
    const result = await model.generateContent([
      getAnalyzePrompt(additionalContext),
      imagePart,
    ])

    const response = await result.response
    return response.text()
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


