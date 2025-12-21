import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIAdapter, AnalyzeImageParams } from './ai-adapter.interface'
import { getGoogleAiApiKey } from '@/lib/config'
import { AI_CONFIG } from '@/lib/constants'
import { AIServiceError } from '@/lib/errors'
import { formatErrorForLogging } from '@/lib/errors'

/**
 * Google AI Adapter
 * Implements the AIAdapter interface for Google Generative AI (Gemini)
 */
export class GoogleAIAdapter implements AIAdapter {
  private genAI: GoogleGenerativeAI
  private modelName: string
  private imageMimeType: string

  constructor() {
    this.genAI = new GoogleGenerativeAI(getGoogleAiApiKey())
    this.modelName = AI_CONFIG.MODEL_NAME
    this.imageMimeType = AI_CONFIG.IMAGE_MIME_TYPE
  }

  async analyzeImage(params: AnalyzeImageParams): Promise<string> {
    const fallbackModels = ['gemini-pro', 'gemini-1.5-pro-001']
    const modelsToTry = [this.modelName, ...fallbackModels]
    const maxRetries = 3

    for (const modelToTry of modelsToTry) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const base64Data = params.imageData.includes(',')
            ? params.imageData.split(',')[1]
            : params.imageData

          const model = this.genAI.getGenerativeModel({ model: modelToTry })

          const imagePart = {
            inlineData: {
              data: base64Data,
              mimeType: this.imageMimeType,
            },
          }

          const result = await model.generateContent([params.prompt, imagePart])
          const response = await result.response
          return response.text()
        } catch (error) {
          const errorMessage = formatErrorForLogging(error)

          const isRateLimitError =
            errorMessage.includes('429') ||
            errorMessage.includes('quota') ||
            errorMessage.includes('rate limit')

          const isModelNotFoundError =
            errorMessage.includes('404') ||
            errorMessage.includes('not found') ||
            errorMessage.includes('is not found for API version')

          if (isRateLimitError && attempt < maxRetries) {
            const retryDelay = this.extractRetryDelay(errorMessage) || Math.pow(2, attempt) * 1000
            console.warn(`Rate limit hit. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`)
            await this.sleep(retryDelay)
            continue
          }

          if (isModelNotFoundError) {
            if (modelToTry === modelsToTry[modelsToTry.length - 1]) {
              console.error(`All models failed. Last attempt with '${modelToTry}' failed. Error:`, errorMessage)
              throw new AIServiceError(
                `No available models found. Tried: ${modelsToTry.join(', ')}. Please check your Google AI API configuration.`
              )
            }
            console.warn(`Model '${modelToTry}' not found, trying fallback...`)
            break
          }

          if (attempt === maxRetries) {
            console.error(`Error analyzing image with Google AI (model: ${modelToTry}):`, errorMessage)
            if (modelToTry === modelsToTry[modelsToTry.length - 1]) {
              throw new AIServiceError('Failed to analyze image after retries')
            }
            break
          }
        }
      }
    }

    throw new AIServiceError('Failed to analyze image after trying all models')
  }

  private extractRetryDelay(errorMessage: string): number | null {
    const retryMatch = errorMessage.match(/retry in ([\d.]+)s/i)
    if (retryMatch) {
      return Math.ceil(parseFloat(retryMatch[1]) * 1000)
    }
    return null
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getProviderName(): string {
    return 'Google AI (Gemini)'
  }
}

