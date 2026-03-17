import { GoogleAIAdapter } from './google-ai.adapter'

const mockText = vi.fn()
const mockGenerateContent = vi.fn()

vi.mock('@/lib/config', () => ({
  getGoogleAiApiKey: vi.fn().mockReturnValue('test-key'),
}))

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent }
      }
    },
  }
})

describe('GoogleAIAdapter', () => {
  let adapter: GoogleAIAdapter

  beforeEach(() => {
    mockText.mockReturnValue('{"dish_name":"Test"}')
    mockGenerateContent.mockResolvedValue({
      response: { text: mockText },
    })
    adapter = new GoogleAIAdapter()
  })

  it('returns analysis result on success', async () => {
    const result = await adapter.analyzeImage({
      imageData: 'base64data',
      prompt: 'analyze this',
    })
    expect(result).toBe('{"dish_name":"Test"}')
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })

  it('strips data URL prefix from imageData', async () => {
    await adapter.analyzeImage({
      imageData: 'data:image/jpeg;base64,actualbase64data',
      prompt: 'analyze',
    })

    const callArgs = mockGenerateContent.mock.calls[0][0]
    expect(callArgs[1].inlineData.data).toBe('actualbase64data')
  })

  it('passes raw base64 when no comma prefix', async () => {
    await adapter.analyzeImage({
      imageData: 'rawbase64',
      prompt: 'analyze',
    })

    const callArgs = mockGenerateContent.mock.calls[0][0]
    expect(callArgs[1].inlineData.data).toBe('rawbase64')
  })

  it('sends prompt and image part to generateContent', async () => {
    await adapter.analyzeImage({
      imageData: 'testdata',
      prompt: 'analyze this food',
    })

    expect(mockGenerateContent).toHaveBeenCalledWith([
      'analyze this food',
      {
        inlineData: {
          data: 'testdata',
          mimeType: 'image/jpeg',
        },
      },
    ])
  })

  it('getProviderName returns correct name', () => {
    expect(adapter.getProviderName()).toBe('Google AI (Gemini)')
  })
})
