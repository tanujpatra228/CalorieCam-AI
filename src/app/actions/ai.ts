'use server'

import { analyzeImage as analyzeImageService } from '@/services/ai-service'
import { validateInput } from '@/lib/validation'
import { analyzeImageSchema } from '@/lib/validation-schemas'

export async function analyzeImage(
  imageData: string,
  additionalContext?: string,
): Promise<string> {
  validateInput(analyzeImageSchema, { imageData, additionalContext })
  return await analyzeImageService(imageData, additionalContext)
}
