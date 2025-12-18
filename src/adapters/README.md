# AI Adapter Pattern

This directory contains the AI adapter implementation that allows easy switching between different AI providers.

## Architecture

The adapter pattern provides a clean abstraction layer for AI providers:

- **`ai-adapter.interface.ts`**: Defines the contract all adapters must implement
- **`ai-adapter.factory.ts`**: Factory that creates the appropriate adapter based on configuration
- **Provider-specific adapters**: Implementations for each AI provider (Google, OpenAI, Anthropic)

## Current Providers

### Google AI (Gemini) - Default
- **Adapter**: `GoogleAIAdapter`
- **Environment Variable**: `GOOGLE_AI_API_KEY`
- **Configuration**: Set `AI_PROVIDER=google` (or omit, as it's the default)

### OpenAI (GPT-4 Vision) - Available
- **Adapter**: `OpenAIAdapter`
- **Environment Variable**: `OPENAI_API_KEY`
- **Model**: `OPENAI_MODEL_NAME` (defaults to `gpt-4o`)
- **Configuration**: Set `AI_PROVIDER=openai`
- **Note**: Uncomment the import and case in `ai-adapter.factory.ts` to enable

### Anthropic (Claude) - Available
- **Adapter**: `AnthropicAdapter`
- **Environment Variable**: `ANTHROPIC_API_KEY`
- **Model**: `ANTHROPIC_MODEL_NAME` (defaults to `claude-3-5-sonnet-20241022`)
- **Configuration**: Set `AI_PROVIDER=anthropic`
- **Note**: Uncomment the import and case in `ai-adapter.factory.ts` to enable

## Usage

The AI service automatically uses the configured adapter:

```typescript
import { analyzeImage } from '@/services/ai-service'

const result = await analyzeImage(imageData, additionalContext)
```

## Adding a New Provider

To add a new AI provider:

1. **Create the adapter class** implementing `AIAdapter`:

```typescript
'use server'

import { AIAdapter, AnalyzeImageParams } from './ai-adapter.interface'
import { AIServiceError } from '@/lib/errors'

export class NewProviderAdapter implements AIAdapter {
  async analyzeImage(params: AnalyzeImageParams): Promise<string> {
    // Implementation here
  }

  getProviderName(): string {
    return 'New Provider Name'
  }
}
```

2. **Add the provider type** to `src/lib/config.ts`:

```typescript
export type AIProvider = 'google' | 'openai' | 'anthropic' | 'newprovider'
```

3. **Update the factory** in `ai-adapter.factory.ts`:

```typescript
import { NewProviderAdapter } from './newprovider.adapter'

// In getAdapter():
case 'newprovider':
  this.adapter = new NewProviderAdapter()
  break
```

4. **Set the environment variable**:

```env
AI_PROVIDER=newprovider
```

## Benefits

- **Easy switching**: Change providers via environment variable
- **Consistent interface**: All providers use the same API
- **Testability**: Easy to mock adapters for testing
- **Extensibility**: Add new providers without modifying existing code
- **Type safety**: TypeScript ensures all adapters implement the interface correctly

