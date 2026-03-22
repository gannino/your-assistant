# AI Providers Setup Guide

This guide walks you through setting up each AI provider available in Your Assistant.

## Table of Contents

- [OpenAI](#openai)
- [Z.ai (Zhipu AI)](#zai-zhipu-ai)
- [Ollama](#ollama)
- [MLX](#mlx)
- [Anthropic Claude](#anthropic-claude)
- [Google Gemini](#google-gemini)
- [OpenRouter](#openrouter)
- [Choosing the Right Provider](#choosing-the-right-provider)

---

## OpenAI

### Overview
- **Models**: GPT-3.5, GPT-4, GPT-4 Turbo
- **API Key Required**: Yes
- **Streaming Support**: Yes
- **Best For**: General-purpose use, high-quality responses

### Setup Steps

1. **Get API Key**
   - Visit https://platform.openai.com
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure in Your Assistant**
   - Open Settings
   - Select "OpenAI" as AI Provider
   - Paste your API Key
   - Choose a model (recommended: `gpt-3.5-turbo` for speed/cost, `gpt-4` for quality)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify you see a success message

### Pricing
- GPT-3.5 Turbo: ~$0.002 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens (input), $0.06 per 1K tokens (output)
- GPT-4 Turbo: ~$0.01 per 1K tokens (input), $0.03 per 1K tokens (output)

### Pros & Cons
✅ High quality responses
✅ Fast streaming
✅ Excellent for technical sessions
❌ Requires paid API key
❌ Can be expensive for heavy use

---

## Z.ai (Zhipu AI)

### Overview
- **Models**: GLM-4.7, GLM-4.6, GLM-4.5, GLM-4-Air
- **API Key Required**: Yes
- **Streaming Support**: Yes
- **Best For**: Chinese language support, cost-effective alternatives to GPT

### Setup Steps

1. **Get API Key**
   - Visit https://z.ai
   - Sign up for an account
   - Navigate to API section
   - Generate an API key
   - Copy the key

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Z.ai" as AI Provider
   - Paste your API Key
   - Default Endpoint: `https://api.z.ai/api/coding/paas/v4`
   - Choose a model (recommended: `glm-4.7`)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify connection is successful

### Pricing
- Check https://z.ai for current pricing
- Generally more cost-effective than GPT-4

### Pros & Cons
✅ Excellent Chinese language support
✅ Cost-effective
✅ Good coding capabilities
❌ May require endpoint configuration
❌ Documentation primarily in Chinese

---

## Ollama

### Overview
- **Models**: Llama2, Mistral, CodeLlama, Neural Chat, and more
- **API Key Required**: No (local)
- **Streaming Support**: Yes
- **Best For**: Privacy, offline use, no API costs

### Setup Steps

1. **Install Ollama**
   - Visit https://ollama.ai
   - Download for your operating system
   - Install Ollama

2. **Pull a Model**
   ```bash
   # Pull a recommended model
   ollama pull llama2
   ollama pull mistral
   ollama pull codellama
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```
   - Default endpoint: `http://localhost:11434`

4. **Configure in Your Assistant**
   - Open Settings
   - Select "Ollama" as AI Provider
   - Endpoint: `http://localhost:11434` (default)
   - Model: Choose from pulled models (e.g., `llama2`, `mistral`, `codellama`)

5. **Test Connection**
   - Click "Test Connection" button
   - Ensure Ollama is running locally

### System Requirements
- CPU: Any modern processor
- RAM: 8GB minimum, 16GB+ recommended
- Disk: 10GB+ per model

### Pros & Cons
✅ Completely free (no API costs)
✅ Works offline
✅ Privacy-focused (data stays local)
❌ Requires local installation
❌ Slower than cloud APIs
❌ Uses system resources

---

## MLX

### Overview
- **Models**: MLX-quantized, MLX-full, Llama-MLX
- **API Key Required**: No (local)
- **Streaming Support**: Yes
- **Best For**: Apple Silicon users, optimized Mac performance

### Setup Steps

1. **Install MLX**
   - Requires Apple Silicon (M1/M2/M3)
   - Visit https://github.com/ml-explore/mlx
   - Follow installation instructions

2. **Start MLX Server**
   ```bash
   # Start the MLX server
   mlx-server --port 8080
   ```

3. **Configure in Your Assistant**
   - Open Settings
   - Select "MLX" as AI Provider
   - Endpoint: `http://localhost:8080` (default)
   - Model: Choose available MLX model

4. **Test Connection**
   - Click "Test Connection" button
   - Ensure MLX server is running

### System Requirements
- **Hardware**: Apple Silicon (M1/M2/M3) required
- **OS**: macOS 14+ (Sonoma or later)
- **RAM**: 16GB+ recommended

### Pros & Cons
✅ Optimized for Apple Silicon
✅ Fast local inference
✅ No API costs
❌ Apple Silicon only
❌ Requires technical setup
❌ macOS only

---

## Anthropic Claude

### Overview
- **Models**: Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku
- **API Key Required**: Yes
- **Streaming Support**: Yes
- **Best For**: Long context, nuanced responses, safety-focused

### Setup Steps

1. **Get API Key**
   - Visit https://console.anthropic.com
   - Sign up or log in
   - Navigate to API Keys
   - Create a new API key
   - Copy the key (starts with `sk-ant-`)

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Anthropic" as AI Provider
   - Paste your API Key
   - Choose a model:
     - `claude-3-haiku-20240307` - Fastest, most cost-effective
     - `claude-3-sonnet-20240229` - Balanced performance
     - `claude-3-opus-20240229` - Highest quality

3. **Test Connection**
   - Click "Test Connection" button
   - Verify connection is successful

### Pricing
- Haiku: ~$0.25 per million tokens (input)
- Sonnet: ~$3 per million tokens (input)
- Opus: ~$15 per million tokens (input)

### Pros & Cons
✅ Excellent long-context understanding
✅ Strong safety features
✅ High-quality responses
❌ More expensive than alternatives
❌ API key required

---

## Google Gemini

### Overview

- **Models**: Gemini 2.0 Flash, Gemini 1.5 Flash, Gemini 1.5 Pro
- **API Key Required**: Yes
- **Streaming Support**: Yes
- **Vision Support**: Yes (screenshots, images)
- **Best For**: Fast responses, multimodal inputs, Google ecosystem integration

### Setup Steps

1. **Get API Key**
   - Visit <https://aistudio.google.com/app/apikey>
   - Sign in with your Google account
   - Create a new API key
   - Copy the key

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Google Gemini" as AI Provider
   - Paste your API Key
   - Choose a model:
     - `gemini-2.0-flash` - Fast, latest (recommended)
     - `gemini-2.0-flash-lite` - Ultra-fast, lightweight
     - `gemini-1.5-flash` - Fast and balanced
     - `gemini-1.5-flash-8b` - Fast with expanded context
     - `gemini-1.5-pro` - Best quality, larger context

3. **Test Connection**
   - Click "Test Connection" button
   - Verify connection is successful

### Vision Support

Gemini supports image inputs for multimodal conversations:

- **Screenshots**: Automatically captured when using auto-mode
- **Image Files**: Drag and drop images into the chat
- **Use Cases**: Visual debugging, document analysis, chart interpretation

### Pricing

- Gemini 1.5 Flash: Free tier available, then ~$0.075 per million tokens
- Gemini 1.5 Pro: ~$1.25 per million tokens (input)
- Gemini 2.0 Flash: Free tier available, then ~$0.075 per million tokens

Check <https://ai.google.dev/gemini-api/docs/pricing> for current pricing.

### Pros & Cons

✅ Fast response times
✅ Excellent vision capabilities
✅ Generous free tier
✅ Official Google SDK support
✅ Multimodal (text + images)

❌ API key required
❌ Google account required
❌ Newer service (long-term track record unknown)

---

## MLX (Apple Silicon Local)

### Overview
- **Models**: MLX-quantized, MLX-full, Llama-MLX, Mistral-MLX
- **API Key Required**: No (local)
- **Streaming Support**: Yes
- **Best For**: Apple Silicon users, optimized Mac performance, privacy-focused

### Setup Steps

1. **Install MLX Framework**
   - **Prerequisites**: Apple Silicon Mac (M1/M2/M3), macOS 14+ (Sonoma or later)
   - Visit https://github.com/ml-explore/mlx
   - Follow installation instructions for your macOS version
   - Install Python 3.10+ if not already installed

2. **Start MLX Server**
   ```bash
   # Start the MLX server (default port 8080)
   mlx-server --port 8080
   
   # Or with custom model
   mlx-server --model mlx-quantized --port 8080
   ```

3. **Configure in Your Assistant**
   - Open Settings
   - Select "MLX" as AI Provider
   - Endpoint: `http://localhost:8080` (default)
   - Model: Choose from available MLX models
   - Temperature: Adjust for creativity (0.3 = focused, 1.0 = balanced)

4. **Test Connection**
   - Click "Test Connection" button
   - Ensure MLX server is running and accessible

### Available Models
- **Quantized Models**: `mlx-quantized`, `mlx-quantized-4bit`, `mlx-quantized-8bit`
- **Full Precision**: `mlx-full`, `mlx-full-precision`
- **Llama Family**: `llama-mlx`, `llama-mlx-7b`, `llama-mlx-13b`, `llama-mlx-70b`
- **Mistral Family**: `mistral-mlx`, `mistral-mlx-7b`, `mixtral-mlx-8x7b`
- **Other Models**: `phi-mlx`, `gemma-mlx`, `qwen-mlx`

### System Requirements
- **Hardware**: Apple Silicon (M1/M2/M3) required
- **OS**: macOS 14+ (Sonoma or later)
- **RAM**: 16GB+ recommended (32GB+ for larger models)
- **Storage**: 10GB+ per model

### Pros & Cons
✅ Optimized for Apple Silicon (excellent performance)
✅ Completely free (no API costs)
✅ Privacy-focused (data stays local)
✅ Fast local inference
❌ Apple Silicon only (won't work on Intel Macs or Windows)
❌ Requires technical setup and MLX installation
❌ macOS only (no Linux/Windows support)
❌ Requires sufficient RAM for model loading

### Troubleshooting MLX

**"MLX server not responding"**
- Ensure MLX is installed: `pip install mlx`
- Check server is running: `mlx-server --port 8080`
- Verify port accessibility: `curl http://localhost:8080/v1/models`

**"Model not found"**
- Check available models: `curl http://localhost:8080/v1/models`
- Ensure model is downloaded and accessible
- Try default model: `mlx-quantized`

**"Insufficient memory"**
- Close other applications to free RAM
- Use quantized models (smaller memory footprint)
- Consider upgrading to 32GB+ RAM for larger models

**"MLX not installed"**
- Install MLX: `pip install mlx`
- Install MLX server: `pip install mlx-server`
- Check Python version compatibility

---

## OpenRouter

### Overview
- **Models**: 300+ models including GPT-4, Claude, Gemini, Llama, Mistral, and more
- **API Key Required**: Yes
- **Streaming Support**: Yes
- **Vision Support**: Yes (for multimodal models)
- **Best For**: Access to all major AI models through a single API

### Setup Steps

1. **Get API Key**
   - Visit <https://openrouter.ai/keys>
   - Sign up or log in
   - Generate an API key
   - Copy the key (starts with `sk-or-v1-`)

2. **Configure in Your Assistant**
   - Open Settings
   - Select "OpenRouter (300+ Models)" as AI Provider
   - Paste your API Key
   - Choose a model (recommended: `anthropic/claude-sonnet-4`)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify connection is successful

### Popular Models

**Claude Models:**
- `anthropic/claude-sonnet-4` - Best balance of speed/capability
- `anthropic/claude-opus-4` - Most capable Claude model

**OpenAI Models:**
- `openai/gpt-4o` - OpenAI's latest GPT-4
- `openai/gpt-4o-mini` - Faster and cheaper

**Google Models:**
- `google/gemini-pro-1.5` - Google's Gemini Pro
- `google/gemini-flash-1.5` - Faster Gemini model

**Open Source:**
- `meta-llama/llama-3.1-70b-instruct` - Meta's Llama
- `mistralai/mistral-large` - Mistral's large model

Browse all models at <https://openrouter.ai/models>

### Pricing
- Pricing varies by model (provider-specific)
- Unified billing across all providers
- Cost tracking included in API responses
- No minimum commitments
- Generally comparable to direct provider pricing

### Pros & Cons
✅ Access to 300+ models through single API
✅ Unified billing and cost tracking
✅ Automatic model updates
✅ No vendor lock-in
✅ Vision support for multimodal models
✅ Competitive pricing
❌ Requires API key
❌ Another account to manage
❌ Dependent on OpenRouter service availability

### Why Choose OpenRouter?
- **Flexibility**: Switch between models instantly without changing API keys
- **Cost Optimization**: Compare costs and choose the best model for each task
- **Future-Proof**: New models added automatically as they're released
- **Transparent**: Built-in cost tracking shows exactly what you're spending
- **Reliable**: Smart caching and retry logic prevent rate limiting

---

## Choosing the Right Provider

### For Beginners
- **AI Provider**: OpenAI (GPT-3.5 Turbo) - Best balance of quality and ease
- **Transcription**: Web Speech API - No setup required

### For Privacy
- **AI Provider**: Ollama or MLX - Keep everything local
- **Transcription**: Azure or Whisper (you control the API key)

### For Cost Savings
- **AI Provider**: Ollama (free) or Z.ai (cost-effective)
- **Transcription**: Web Speech API (free)

### For Quality
- **AI Provider**: OpenAI (GPT-4) or Anthropic (Claude Opus)
- **Transcription**: Whisper (highest accuracy)

### For Chinese Language
- **AI Provider**: Z.ai (GLM models)
- **Transcription**: Azure (excellent Chinese support)

### For Speed
- **AI Provider**: OpenAI (GPT-3.5 Turbo) or Claude Haiku
- **Transcription**: Deepgram (lowest latency)

---

## Troubleshooting

### Common Issues

**"Failed to fetch" error**
- Check your internet connection
- Verify API key is correct
- Check if the provider service is operational

**"API key invalid" error**
- Double-check your API key
- Ensure you copied the entire key (no extra spaces)
- Verify the key hasn't expired

**"Connection timeout" with local providers (Ollama/MLX)**
- Ensure the local server is running
- Check the endpoint URL is correct
- Verify firewall isn't blocking the connection

**"Model not found" error**
- Check model name spelling
- Verify the model is available for your account
- For Ollama: Ensure you've pulled the model

### Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review provider-specific documentation
3. Check browser console for detailed error messages
4. Open an issue on GitHub

---

## Security Best Practices

1. **Never share API keys** publicly
2. **Store keys securely** - Your Assistant stores them in browser localStorage
3. **Rotate keys regularly** - Especially for production use
4. **Monitor usage** - Check your provider dashboards for unusual activity
5. **Use environment variables** when developing locally

---

## API Key Management

### Where Keys Are Stored
- Your Assistant stores API keys in your browser's localStorage
- Keys are never sent to any server except the specified AI provider
- Clearing browser data will remove your keys

### Backing Up Keys
- Store your API keys in a secure password manager
- Keep a backup in case you need to re-enter them
- Never commit API keys to version control

### Revoking Keys
- If a key is compromised, revoke it immediately from the provider's dashboard
- Generate a new key and update it in Your Assistant settings

---

For more information, see:
- [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Provider Comparison](./PROVIDER_COMPARISON.md)
