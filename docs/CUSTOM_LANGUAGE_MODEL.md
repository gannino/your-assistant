# Custom Language and Model Configuration

## Overview

Your Assistant now supports custom language codes and model names for **ALL providers**, giving you complete flexibility to use the latest models and languages even if they're not in the dropdown list.

## Custom Language Codes

### How to Use

**All speech recognition providers** support custom language input:

1. Click on the language dropdown
2. Start typing your custom language code
3. Press Enter to create and select it

### Language Code Format

Different providers use different formats:

#### Azure Speech & Web Speech API
- Format: `language-REGION` (e.g., `en-GB`, `fr-CA`, `zh-CN`)
- Examples:
  - `en-US` - English (United States)
  - `en-GB` - English (United Kingdom)
  - `en-AU` - English (Australia)
  - `fr-FR` - French (France)
  - `fr-CA` - French (Canada)
  - `es-ES` - Spanish (Spain)
  - `es-MX` - Spanish (Mexico)
  - `pt-BR` - Portuguese (Brazil)
  - `pt-PT` - Portuguese (Portugal)

#### Whisper & Deepgram
- Format: `language` (2-letter ISO 639-1 code)
- Examples:
  - `en` - English
  - `zh` - Chinese
  - `es` - Spanish
  - `fr` - French
  - `de` - German
  - `ja` - Japanese
  - `ko` - Korean
  - `ar` - Arabic
  - `hi` - Hindi
  - `ru` - Russian

### Documentation Links

Every provider includes a link to official language documentation:

- **Azure Speech**: [Language Support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=stt) - 100+ languages
- **OpenAI Whisper**: [Supported Languages](https://platform.openai.com/docs/guides/speech-to-text/supported-languages) - 50+ languages
- **Web Speech API**: [Language Codes](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/lang) - Browser-dependent
- **Deepgram**: [Languages Overview](https://developers.deepgram.com/docs/languages-overview) - 30+ languages

## Custom Model Names

### How to Use

**All providers** (both AI and transcription) support custom model input:

1. Click on the model dropdown
2. Start typing your custom model name
3. Press Enter to create and select it

### When to Use Custom Models

- **New models released**: Providers frequently release new models
- **Fine-tuned models**: You have custom fine-tuned models
- **Beta models**: You have access to beta/preview models
- **Regional models**: Some models are region-specific

### Examples by Provider

#### OpenAI
```
gpt-4-turbo-2024-04-09
gpt-4-0125-preview
gpt-3.5-turbo-0125
gpt-4-vision-preview
```

#### Anthropic Claude
```
claude-3-opus-20240229
claude-3-sonnet-20240229
claude-3-haiku-20240307
claude-3-5-sonnet-20241022
```

#### Z.ai (Zhipu)
```
glm-4-plus
glm-4-0520
glm-4-air
glm-4-airx
```

#### Ollama
```
llama3:70b
mistral:7b-instruct
codellama:13b
gemma:7b
phi3:medium
```

#### MLX
```
mlx-community/Llama-3-8B-4bit
mlx-community/Mistral-7B-v0.1-4bit
mlx-community/phi-2-4bit
```

#### Google Gemini
```
gemini-2.0-flash
gemini-2.0-flash-lite
gemini-2.0-flash-thinking-exp-01-21
gemini-1.5-pro
gemini-1.5-flash
gemini-1.5-flash-8b
```

#### OpenRouter
```
anthropic/claude-sonnet-4
anthropic/claude-opus-4
openai/gpt-4o
openai/gpt-4o-mini
google/gemini-pro-1.5
google/gemini-flash-1.5
meta-llama/llama-3.1-70b-instruct
```

#### Transcription Providers

**OpenAI Whisper**
```
whisper-1
whisper-large-v3
```

**Deepgram**
```
nova-2
nova-2-general
nova-2-meeting
nova-2-phonecall
enhanced
base
```

### Documentation Links

Every provider includes a link to official model documentation:

**AI Providers:**
- **OpenAI**: [Models Overview](https://platform.openai.com/docs/models)
- **Anthropic**: [Claude Models](https://docs.anthropic.com/en/docs/about-claude/models)
- **Z.ai**: [API Documentation](https://open.bigmodel.cn/dev/api)
- **Ollama**: [Model Library](https://ollama.ai/library)
- **MLX**: [MLX Examples](https://github.com/ml-explore/mlx-examples)
- **Gemini**: [Gemini Models](https://ai.google.dev/gemini-api/docs/models)
- **OpenRouter**: [Available Models](https://openrouter.ai/models)

**Transcription Providers:**
- **OpenAI Whisper**: [Whisper Models](https://platform.openai.com/docs/models/whisper)
- **Deepgram**: [Models Overview](https://developers.deepgram.com/docs/models-overview)

## Tips

### For Languages

1. **Check provider support**: Not all languages work with all providers
2. **Test first**: Use the "Test Connection" button to verify
3. **Regional variants**: Some providers support regional variants (e.g., en-US vs en-GB)
4. **Fallback**: If a custom language doesn't work, try the closest standard option

### For Models

1. **Verify access**: Make sure your API key has access to the model
2. **Check spelling**: Model names are case-sensitive
3. **Use "Refresh Models"**: This queries the API for available models
4. **Test connection**: Verify the model works before starting a session

## Troubleshooting

### Language Not Working

**Problem**: Custom language code doesn't transcribe correctly

**Solutions**:
- Verify the language code format matches the provider's requirements
- Check the provider's documentation for supported languages
- Try a standard language from the dropdown first
- Use "Test Connection" to validate configuration

### Model Not Found

**Problem**: "Model not found" or "Invalid model" error

**Solutions**:
- Verify the exact model name from provider documentation
- Check your API key has access to that model
- Try clicking "Refresh Models" to reload the list
- Some models require special access or waitlist approval

### Custom Input Not Saving

**Problem**: Custom value disappears after page reload

**Solutions**:
- Make sure you pressed Enter after typing
- Check browser console for errors
- Try clearing browser cache and re-entering
- Verify localStorage is enabled in your browser

## Examples

### Example 1: Using Canadian French with Azure

1. Go to Speech Settings
2. Select "Microsoft Azure"
3. Click Language dropdown
4. Type `fr-CA`
5. Press Enter
6. Click "Test Connection"

### Example 2: Using Latest GPT-4 Turbo

1. Go to AI Settings
2. Select "OpenAI"
3. Enter your API key
4. Click "Refresh Models" (loads latest models)
5. If your model isn't listed, type it manually: `gpt-4-turbo-2024-04-09`
6. Press Enter
7. Click "Test Connection"

### Example 3: Using Custom Ollama Model

1. Pull model locally: `ollama pull llama3:70b`
2. Go to AI Settings
3. Select "Ollama"
4. Click Model dropdown
5. Type `llama3:70b`
6. Press Enter
7. Click "Test Connection"

## Benefits

✅ **Future-proof**: Use new models/languages as soon as they're released
✅ **Flexibility**: Support for fine-tuned and custom models
✅ **No waiting**: Don't wait for app updates to use new features
✅ **Regional support**: Use region-specific language variants
✅ **Power user friendly**: Advanced users can leverage full provider capabilities

## Need Help?

If you're unsure about:
- Language codes for your provider
- Available models
- Custom model names

Click the documentation links provided next to each dropdown, or refer to the provider's official documentation.
