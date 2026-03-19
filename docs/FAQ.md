# Frequently Asked Questions (FAQ)

Common questions about Your Assistant.

## Table of Contents

- [General Questions](#general-questions)
- [AI Providers](#ai-providers)
- [Transcription Providers](#transcription-providers)
- [Setup & Configuration](#setup--configuration)
- [Privacy & Security](#privacy--security)
- [Cost & Pricing](#cost--pricing)
- [Technical Questions](#technical-questions)

---

## General Questions

### What is Your Assistant?

Your Assistant is a real-time AI-powered assistant that:
- Listens to live audio and transcribes speech to text
- Lets you add your own typed messages alongside the transcript
- Generates intelligent AI responses using your chosen provider
- Builds a rolling session history automatically in the background
- Can summarize the full session on demand

It works for any scenario where you need an AI copilot — meetings, research sessions, technical discussions, or any live conversation.

### Is Your Assistant free?

**Free Options:**
- Application itself is free and open-source
- Web Speech API (transcription) — completely free
- Ollama (AI) — free but requires local setup
- MLX (AI) — free for Apple Silicon users

**Paid Options:**
- OpenAI, Anthropic, Z.ai, Gemini — require API keys with usage costs
- Azure, Whisper, Deepgram — have free tiers, paid for heavy use

**Typical Cost:** $0–2 per hour depending on providers chosen

### What browsers are supported?

**Recommended:**
- Google Chrome (best compatibility)
- Microsoft Edge

**Limited Support:**
- Firefox (Web Speech API not supported)
- Safari (Web Speech API not supported)

**Mobile:**
- Chrome Android (good support)
- Edge Android (good support)
- Safari iOS (limited support)

### Can I use Your Assistant offline?

**Partially:**
- **AI Providers:** Ollama and MLX work offline
- **Transcription:** All providers require internet
- **Application:** Must be loaded from internet initially

For fully offline use, self-host the application.

---

## AI Providers

### Which AI provider should I choose?

**For Beginners:** OpenAI (GPT-3.5 Turbo) — best balance of quality and ease

**For Quality:** OpenAI (GPT-4) or Anthropic (Claude Opus) — highest quality

**For Cost Savings:** Ollama (free, local) or Z.ai (cost-effective)

**For Privacy:** Ollama or MLX (everything stays local)

**For Vision (screenshots):** Gemini or GPT-4V — support image inputs

### Can I switch between AI providers?

Yes, at any time:
1. Open Settings → AI Provider
2. Select a different provider
3. Enter API key if needed
4. Test connection
5. Start using

Settings persist between sessions.

### Which AI model should I use?

**OpenAI:** `gpt-3.5-turbo` (fast/cheap) or `gpt-4` (best quality)

**Z.ai:** `glm-4.7` (latest) or `glm-4.6` (previous)

**Anthropic:** `claude-3-haiku` (fastest) → `claude-3-sonnet` → `claude-3-opus` (best)

**Ollama:** `mistral` (excellent quality), `codellama` (best for code), `llama2` (general)

**Gemini:** `gemini-1.5-flash` (fast) or `gemini-1.5-pro` (best quality)

---

## Transcription Providers

### Which transcription provider should I choose?

**For Free Use:** Web Speech API — completely free, no setup

**For Best Accuracy:** Whisper (OpenAI) — state-of-the-art

**For Real-Time:** Deepgram — lowest latency (200–300ms)

**For Multiple Languages:** Azure — supports 100+ languages

### What if Web Speech API doesn't work?

Common issues:
1. **Network Error** — Can't reach Google's service → disable VPN, try Chrome
2. **Not Supported** — Wrong browser → use Chrome or Edge

**Alternatives:** Azure (5 free hours/month), Deepgram (200 free hours/month), Whisper (paid)

### Can I use transcription for other languages?

Yes:
- **Azure:** 100+ languages — best for non-English sessions
- **Whisper:** 50+ languages — handles accents well
- **Web Speech API:** 20–50 languages depending on browser
- **Deepgram:** 30+ languages

---

## Setup & Configuration

### Where are my API keys stored?

API keys are stored in your **browser's localStorage**, on your local computer only. They are never sent to any server except the provider's own API endpoint.

### Can I use Your Assistant on multiple devices?

Yes, but settings are not synced between devices. Each device needs separate configuration.

### How do I backup my settings?

1. Open DevTools (F12) → Console tab
2. Run: `console.log(JSON.stringify(localStorage))`
3. Copy and save the output

To restore, parse and load the saved data in the console, then refresh.

---

## Privacy & Security

### Is my session data private?

**Data flow:**
- **Audio** → sent to your chosen transcription provider
- **Transcript** → sent to your chosen AI provider
- **Storage** → Your Assistant does not store or transmit any data itself

For maximum privacy, use Ollama or MLX (local processing) with Web Speech API.

### Is it ethical to use AI assistance?

Your Assistant is a general-purpose tool. Whether it's appropriate to use in a given context depends on the rules and expectations of that context. Always check applicable policies before using in professional or formal settings.

---

## Cost & Pricing

### How much does it cost per hour?

**Free:** Web Speech API + Ollama = $0

**Budget:** Web Speech API + Z.ai = $0.05–0.10

**Standard:** Web Speech API + GPT-3.5 = $0.10–0.20

**Premium:** Whisper + GPT-4 = $1.36–1.86

### Are there free tiers?

**AI:** Ollama and MLX are completely free (local)

**Transcription:** Web Speech API (unlimited free), Azure (5 hrs/mo), Deepgram (200 hrs/mo)

### Will I be charged automatically?

No. You add API keys to your own provider accounts and control spending through their dashboards. Your Assistant does not handle billing.

---

## Technical Questions

### What technology does Your Assistant use?

- **Frontend:** Vue 3 (Composition API), Element Plus
- **Desktop:** Electron (transparent overlay, global shortcuts)
- **Architecture:** Provider abstraction pattern, localStorage config, serverless
- **AI:** OpenAI SDK, Anthropic SDK, REST APIs, SSE streaming
- **Transcription:** Azure Speech SDK, WebSocket (Deepgram), Web Speech API

### Can I self-host Your Assistant?

Yes — it's a static web application:

```bash
git clone <repo>
npm install
npm run build
# Deploy dist/ to any static host (GitHub Pages, Netlify, Vercel, etc.)
```

### Can I extend Your Assistant?

Yes — it's open-source. Add custom AI or transcription providers by implementing the base provider interface. See [Development Guide](./DEVELOPMENT_GUIDE.md).

### What are the system requirements?

**Browser:** Chrome or Edge (recommended), modern version

**For Ollama:** 8GB+ RAM, 10GB+ disk per model

**For MLX:** Apple Silicon (M1/M2/M3), macOS 14+, 16GB+ RAM recommended

---

## Getting Help

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [AI Providers Setup](./AI_PROVIDERS_SETUP.md)
- [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
- [GitHub Issues](https://github.com/your-repo/your-assistant/issues)

---

**Last Updated:** 2025
