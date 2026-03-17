vi.mock('@/adapters/ai-adapter.factory', () => ({
  AIAdapterFactory: {
    getAdapter: vi.fn(),
  },
}))

vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn(),
}))

import { analyzeImage, getAnalyzePrompt } from './ai-service'
import { AIAdapterFactory } from '@/adapters/ai-adapter.factory'
import { IMG_ANALYZE_PROMPT } from '@/lib/constants'
import { AIServiceError } from '@/lib/errors'
import { validateInput } from '@/lib/validation'

const mockAdapter = {
  analyzeImage: vi.fn(),
}

describe('ai-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(AIAdapterFactory.getAdapter).mockReturnValue(mockAdapter as any)
    vi.mocked(validateInput).mockImplementation((_schema, data) => data as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('analyzeImage', () => {
    const validBase64 = 'aGVsbG8='
    const analysisResult = JSON.stringify({
      dish_name: 'Pasta',
      macros: { calories_kcal: 500 },
    })

    it('returns the analysis result on success', async () => {
      mockAdapter.analyzeImage.mockResolvedValue(analysisResult)

      const result = await analyzeImage(validBase64)

      expect(result).toBe(analysisResult)
    })

    it('calls validateInput with the correct schema and data', async () => {
      mockAdapter.analyzeImage.mockResolvedValue(analysisResult)

      await analyzeImage(validBase64, 'extra context')

      expect(validateInput).toHaveBeenCalledWith(
        expect.anything(),
        { imageData: validBase64, additionalContext: 'extra context' },
      )
    })

    it('passes the formatted prompt to the adapter', async () => {
      mockAdapter.analyzeImage.mockResolvedValue(analysisResult)

      await analyzeImage(validBase64, 'homemade dish')

      expect(mockAdapter.analyzeImage).toHaveBeenCalledWith({
        imageData: validBase64,
        prompt: expect.stringContaining('homemade dish'),
      })
    })

    it('uses N/A when no additional context is provided', async () => {
      mockAdapter.analyzeImage.mockResolvedValue(analysisResult)

      await analyzeImage(validBase64)

      expect(mockAdapter.analyzeImage).toHaveBeenCalledWith({
        imageData: validBase64,
        prompt: expect.stringContaining('N/A'),
      })
    })

    it('throws AIServiceError when adapter throws', async () => {
      mockAdapter.analyzeImage.mockRejectedValue(new Error('API down'))

      await expect(analyzeImage(validBase64)).rejects.toThrow(AIServiceError)
      await expect(analyzeImage(validBase64)).rejects.toThrow('Failed to analyze image')
    })

    it('logs the error to console.error on failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockAdapter.analyzeImage.mockRejectedValue(new Error('timeout'))

      await expect(analyzeImage(validBase64)).rejects.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error analyzing image:',
        expect.any(String),
      )
      consoleSpy.mockRestore()
    })

    it('throws AIServiceError even for non-Error exceptions', async () => {
      mockAdapter.analyzeImage.mockRejectedValue('string error')

      await expect(analyzeImage(validBase64)).rejects.toThrow(AIServiceError)
    })

    it('propagates validation errors before reaching the adapter', async () => {
      const { ValidationError } = await import('@/lib/errors')
      vi.mocked(validateInput).mockImplementation(() => {
        throw new ValidationError('Image data is required')
      })

      // ValidationError is NOT caught by the try-catch (which re-throws as AIServiceError)
      // Actually it IS caught because validateInput is called outside the try block.
      // Let me re-check: validateInput is called BEFORE try, so it propagates directly.
      // But the catch wraps it... No, validateInput is outside the try block in the source.
      await expect(analyzeImage('')).rejects.toThrow('Image data is required')
    })
  })

  describe('getAnalyzePrompt', () => {
    it('replaces {{additionalContext}} with provided context', () => {
      const result = getAnalyzePrompt('This is a salad')

      expect(result).toContain('This is a salad')
      expect(result).not.toContain('{{additionalContext}}')
    })

    it('replaces {{additionalContext}} with N/A when no context provided', () => {
      const result = getAnalyzePrompt()

      expect(result).toContain('N/A')
      expect(result).not.toContain('{{additionalContext}}')
    })

    it('replaces {{additionalContext}} with N/A for empty string', () => {
      const result = getAnalyzePrompt('')

      expect(result).toContain('N/A')
    })

    it('preserves the rest of the prompt template', () => {
      const result = getAnalyzePrompt('test')

      expect(result).toContain('food recognition')
      expect(result).toContain('macronutrients')
    })
  })
})
