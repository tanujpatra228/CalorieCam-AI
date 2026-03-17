describe('config', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('getAppUrl', () => {
    it('returns NEXT_PUBLIC_APP_URL when set', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://my-app.com')
      vi.stubEnv('VERCEL_URL', 'vercel-deploy.vercel.app')
      const { getAppUrl } = await import('./config')
      expect(getAppUrl()).toBe('https://my-app.com')
      vi.unstubAllEnvs()
    })

    it('falls back to VERCEL_URL with https prefix', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
      vi.stubEnv('VERCEL_URL', 'my-deploy.vercel.app')
      const { getAppUrl } = await import('./config')
      expect(getAppUrl()).toBe('https://my-deploy.vercel.app')
      vi.unstubAllEnvs()
    })

    it('falls back to localhost when no env vars set', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
      vi.stubEnv('VERCEL_URL', '')
      const { getAppUrl } = await import('./config')
      expect(getAppUrl()).toBe('http://localhost:3000')
      vi.unstubAllEnvs()
    })
  })

  describe('getGoogleAiApiKey', () => {
    it('returns the GOOGLE_AI_API_KEY env var', async () => {
      vi.stubEnv('GOOGLE_AI_API_KEY', 'test-key-123')
      const { getGoogleAiApiKey } = await import('./config')
      expect(getGoogleAiApiKey()).toBe('test-key-123')
      vi.unstubAllEnvs()
    })
  })

  describe('getAIProvider', () => {
    it('defaults to google when AI_PROVIDER is not set', async () => {
      vi.stubEnv('AI_PROVIDER', '')
      const { getAIProvider } = await import('./config')
      expect(getAIProvider()).toBe('google')
      vi.unstubAllEnvs()
    })

    it('returns configured provider', async () => {
      vi.stubEnv('AI_PROVIDER', 'openai')
      const { getAIProvider } = await import('./config')
      expect(getAIProvider()).toBe('openai')
      vi.unstubAllEnvs()
    })
  })

  describe('getCloudinaryCloudName', () => {
    it('returns empty string when not configured', async () => {
      vi.stubEnv('CLOUDINARY_CLOUD_NAME', '')
      const { getCloudinaryCloudName } = await import('./config')
      expect(getCloudinaryCloudName()).toBe('')
      vi.unstubAllEnvs()
    })
  })
})
