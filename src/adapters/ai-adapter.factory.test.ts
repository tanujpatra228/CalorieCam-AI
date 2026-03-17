vi.mock('@/lib/config', () => ({
  getAIProvider: vi.fn(),
  getGoogleAiApiKey: vi.fn().mockReturnValue('test-key'),
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn(),
  })),
}))

import { AIAdapterFactory } from './ai-adapter.factory'
import { GoogleAIAdapter } from './google-ai.adapter'
import { getAIProvider } from '@/lib/config'

describe('AIAdapterFactory', () => {
  beforeEach(() => {
    AIAdapterFactory.reset()
    vi.mocked(getAIProvider).mockReturnValue('google')
  })

  it('returns a GoogleAIAdapter when provider is google', () => {
    const adapter = AIAdapterFactory.getAdapter()
    expect(adapter).toBeInstanceOf(GoogleAIAdapter)
  })

  it('returns the same instance on subsequent calls (singleton)', () => {
    const first = AIAdapterFactory.getAdapter()
    const second = AIAdapterFactory.getAdapter()
    expect(first).toBe(second)
  })

  it('creates a new instance after reset', () => {
    const first = AIAdapterFactory.getAdapter()
    AIAdapterFactory.reset()
    const second = AIAdapterFactory.getAdapter()
    expect(first).not.toBe(second)
  })

  it('throws for unsupported provider', () => {
    vi.mocked(getAIProvider).mockReturnValue('unknown' as any)
    expect(() => AIAdapterFactory.getAdapter()).toThrow('Unsupported AI provider: unknown')
  })

  it('only calls getAIProvider once for singleton', () => {
    AIAdapterFactory.getAdapter()
    AIAdapterFactory.getAdapter()
    expect(getAIProvider).toHaveBeenCalledTimes(1)
  })
})
