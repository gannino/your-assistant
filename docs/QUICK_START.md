# Quick Start Guide

Get Your Assistant running in 5 minutes.

## Option 1: Free (No API Keys)

**Best for:** Testing, learning, budget-conscious users

1. Open Your Assistant
2. Go to **Settings → Speech Recognition**
3. Select **Web Speech API** (no setup needed)
4. Go to **Settings → AI Provider**
5. Select **Ollama** or **MLX** (requires local installation)
6. Click **Start Session**

**Cost:** $0/hour

## Option 2: OpenRouter (300+ Models)

**Best for:** Access to all major AI models through a single API

1. Get **OpenRouter API key**: https://openrouter.ai/keys
2. Go to **Settings → AI Provider**
   - Select **OpenRouter (300+ Models)**
   - Paste your API key
   - Choose model: `anthropic/claude-sonnet-4` (balanced) or `openai/gpt-4o` (latest)
3. Go to **Settings → Speech Recognition**
   - Select **Web Speech API** (free) or **Azure** (5 free hours/month)
4. Click **Start Session**

**Cost:** $0.10–1.00/hour (varies by model)

**Why OpenRouter?**
- ✅ Access to GPT-4, Claude, Gemini, Llama, and 300+ more
- ✅ Unified billing across all providers
- ✅ Cost tracking included
- ✅ Automatic model updates
- ✅ No vendor lock-in

## Option 3: Premium (Best Quality)

**Best for:** High-quality responses, professional use

1. Get **OpenAI API key**: https://platform.openai.com/api-keys
2. Go to **Settings → AI Provider**
   - Select **OpenAI**
   - Choose model: `gpt-4o` or `gpt-4o-mini`
3. Go to **Settings → Speech Recognition**
   - Select **Whisper** (best accuracy)
4. Click **Start Session**

**Cost:** $1.00–2.00/hour

## Adding Context (Optional)

Attach documents to give the AI background knowledge:

1. Go to **Settings → Content**
2. Upload PDFs (resume, notes, job description, etc.)
3. Or fetch website content (portfolio, documentation, etc.)
4. Click **Summarize Context** to pre-process documents for instant responses

## Using the Chat Input

You can add your own messages alongside the transcribed speech:

- Type in the chat box at the bottom of the Speech panel
- Press **Enter** or click **Ask AI** — your message is appended to the transcript and sent together
- Useful for adding context, clarifying questions, or asking something not spoken aloud

## Session History & Summary

- **History** builds automatically in the background after each AI response — a rolling bullet-point summary of all Q&A exchanges
- Click **History** in the AI panel header to view it at any time
- Click **Summarize Session** to generate a full recap of the session transcript and responses

## Testing Your Setup

1. Go to **Settings**
2. Click **Test Connection** buttons
3. Verify all providers are working
4. Check browser console (F12) for errors

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Web Speech API network error | Disable VPN, try Chrome instead of Edge |
| Microphone not working | Grant microphone permission in browser |
| API key invalid | Verify key is correct, check account status |
| No models loading | Enter API key first, then refresh |
| "Access to internal/private network resources" | Only public `https://` URLs are accepted for website context |
| Microphone fails in Electron | Use `npm run electron:dev:https` instead of `electron:dev` |

## Electron Desktop App

**💡 Pre-built apps available:** Download from [GitHub Releases](https://github.com/gannino/your-assistant/releases) for macOS, Windows, and Linux.

---

Run Your Assistant as a transparent always-on-top overlay on your desktop.

### Prerequisites
- Node.js 24+ installed
- Dependencies installed: `npm install`

### Start in development

```bash
# HTTP — works for most features
npm run electron:dev

# HTTPS — required if microphone doesn't work over HTTP
npm run electron:dev:https
```

> **Why HTTPS?** Chromium (used by Electron) requires a secure context for microphone access on some platforms. If the microphone fails to start with `electron:dev`, switch to `electron:dev:https`. Self-signed certs are generated automatically via `npm run generate:certs`.

### Build a distributable

```bash
npm run electron:build:mac    # macOS → DMG + ZIP  (release/)
npm run electron:build:win    # Windows → NSIS + portable
npm run electron:build:linux  # Linux → AppImage + deb
npm run electron:build        # all platforms
```

### Keyboard shortcuts (desktop)

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+Space` | Show / hide window |
| `Alt+M` / `Cmd+M` | Toggle overlay / Picture-in-Picture mode |
| Arrow keys | Move window |

### Electron settings

Go to **Settings → Electron** to configure opacity, blur, window size, and Auto Mode.

## Next Steps

- **Learn more:** See [AI Providers Setup](./AI_PROVIDERS_SETUP.md) and [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
- **Troubleshoot:** Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Compare:** See [Provider Comparison](./PROVIDER_COMPARISON.md)
- **Develop:** See [Development Guide](./DEVELOPMENT_GUIDE.md)

## Common Questions

**Q: Is it free?**
A: The app is free. Providers have free tiers or paid options.

**Q: Can I use it offline?**
A: Partially. Ollama/MLX work offline, but transcription needs internet.

**Q: Is my data private?**
A: Yes. API keys stored locally. Data sent only to your chosen providers.

**Q: Can I use it on mobile?**
A: Yes! Works on iOS/Android in Chrome/Edge.

For more questions, see [FAQ](./FAQ.md).
