# Provider Comparison Guide

Quick reference for choosing the right providers.

## AI Providers Comparison

### By Use Case

**Best Quality**
- OpenAI GPT-4 (95-98% accuracy)
- Anthropic Claude Opus (95-98% accuracy)

**Best Speed**
- OpenAI GPT-3.5 Turbo (~1s response)
- Claude Haiku (~1s response)

**Best Value**
- Z.ai GLM-4.7 ($0.05-0.10/hour)
- Ollama (free, local)

**Best for Chinese**
- Z.ai GLM-4 series
- OpenAI GPT-4

**Best for Privacy**
- Ollama (local, free)
- MLX (local, free, Apple Silicon only)

### Detailed Comparison

| Feature | OpenAI | Z.ai | Ollama | MLX | Anthropic |
|---------|--------|------|--------|-----|-----------|
| **Cost/hour** | $0.10-2.00 | $0.05-0.10 | Free | Free | $0.20-1.50 |
| **Quality** | Excellent | Good | Good | Good | Excellent |
| **Speed** | Fast | Fast | Slow | Medium | Fast |
| **Setup** | API key | API key | Local install | Local install | API key |
| **Privacy** | Cloud | Cloud | Local | Local | Cloud |
| **Chinese** | Good | Excellent | Good | Good | Good |
| **Streaming** | Yes | Yes | Yes | Yes | Yes |
| **Free tier** | No | No | Yes | Yes | No |

### Pricing Breakdown (per hour)

**OpenAI**
- GPT-3.5 Turbo: $0.10-0.20
- GPT-4: $0.80-1.50
- GPT-4 Turbo: $0.30-0.60

**Z.ai**
- GLM-4.7: $0.05-0.10
- GLM-4 Air: $0.02-0.05

**Anthropic**
- Claude Haiku: $0.20-0.30
- Claude Sonnet: $0.50-0.80
- Claude Opus: $1.00-1.50

**Ollama/MLX**
- Free (local)

---

## Transcription Providers Comparison

### By Use Case

**Best Accuracy**
- Whisper (95-98%)
- Azure (90-95%)

**Best Speed (Latency)**
- Web Speech API (<100ms)
- Deepgram (200-300ms)

**Best Free Option**
- Web Speech API (unlimited, free)
- Deepgram (200 hours/month free)

**Best for Multiple Languages**
- Azure (100+ languages)
- Whisper (50+ languages)

**Best for live sessions**
- Deepgram (real-time streaming)
- Web Speech API (real-time)

### Detailed Comparison

| Feature | Whisper | Azure | Deepgram | Web Speech |
|---------|---------|-------|----------|------------|
| **Accuracy** | 95-98% | 90-95% | 90-95% | 85-90% |
| **Latency** | 5s | 300-500ms | 200-300ms | <100ms |
| **Cost/hour** | $0.006 | $1.00 | $0.009 | Free |
| **Setup** | API key | API key | API key | None |
| **Languages** | 50+ | 100+ | 30+ | 20-50 |
| **Free tier** | No | 5 hrs/mo | 200 hrs/mo | Unlimited |
| **Requires internet** | Yes | Yes | Yes | Yes |
| **Browser support** | All | All | All | Chrome/Edge |

### Pricing Breakdown (per hour)

**Whisper**
- $0.006 per minute = $0.36/hour

**Azure**
- Free: 5 hours/month
- Standard: $1.00/hour

**Deepgram**
- Free: 200 hours/month
- Pay-as-you-go: $0.009 per minute = $0.54/hour

**Web Speech API**
- Free (unlimited)

---

## Recommended Combinations

### For Beginners (Lowest Cost)
- **AI:** Ollama (free)
- **Transcription:** Web Speech API (free)
- **Cost:** $0/hour
- **Setup:** 30 minutes

### For Learning (Low Cost)
- **AI:** Z.ai GLM-4.7 ($0.05-0.10/hour)
- **Transcription:** Web Speech API (free)
- **Cost:** $0.05-0.10/hour
- **Setup:** 10 minutes

### For Practice (Recommended)
- **AI:** OpenAI GPT-3.5 Turbo ($0.10-0.20/hour)
- **Transcription:** Web Speech API (free) or Azure (5 free hours)
- **Cost:** $0.10-0.20/hour
- **Setup:** 15 minutes

### For Quality (Premium)
- **AI:** OpenAI GPT-4 ($0.80-1.50/hour)
- **Transcription:** Whisper ($0.36/hour)
- **Cost:** $1.16-1.86/hour
- **Setup:** 15 minutes

### For Real-time (live sessions)
- **AI:** OpenAI GPT-3.5 Turbo ($0.10-0.20/hour)
- **Transcription:** Deepgram ($0.54/hour)
- **Cost:** $0.64-0.74/hour
- **Setup:** 15 minutes

### For Privacy (Local Only)
- **AI:** Ollama or MLX (free)
- **Transcription:** None (all require internet)
- **Cost:** $0/hour
- **Setup:** 1-2 hours (local setup)

### For Chinese (Best Support)
- **AI:** Z.ai GLM-4.7 ($0.05-0.10/hour)
- **Transcription:** Azure ($1.00/hour) or Whisper ($0.36/hour)
- **Cost:** $1.05-1.46/hour
- **Setup:** 20 minutes

---

## Decision Matrix

**Choose OpenAI if:**
- You want the best quality
- You're willing to pay for it
- You want the most models to choose from

**Choose Z.ai if:**
- You want good quality at low cost
- You need Chinese language support
- You want to try before committing

**Choose Ollama if:**
- You want completely free
- You have decent hardware (8GB+ RAM)
- You value privacy

**Choose MLX if:**
- You have Apple Silicon (M1/M2/M3)
- You want free local inference
- You want optimized performance

**Choose Anthropic if:**
- You need long context windows
- You want strong safety features
- You're willing to pay premium prices

---

## Cost Calculator

**Estimate your monthly cost:**

```
AI Cost = (hours/month) × (cost/hour)
Transcription Cost = (hours/month) × (cost/hour)
Total = AI Cost + Transcription Cost
```

**Examples:**

1. **10 hours/month practice**
   - OpenAI GPT-3.5 + Web Speech: $1.00-2.00
   - Z.ai + Web Speech: $0.50-1.00
   - Ollama + Web Speech: $0.00

2. **50 hours/month intensive**
   - OpenAI GPT-4 + Whisper: $58-93
   - OpenAI GPT-3.5 + Deepgram: $32-37
   - Z.ai + Azure: $52-55

3. **100 hours/month professional**
   - OpenAI GPT-4 + Whisper: $116-186
   - OpenAI GPT-3.5 + Deepgram: $64-74
   - Z.ai + Azure: $104-110

---

## Migration Guide

**Switching providers is easy:**

1. Go to Settings
2. Select new provider
3. Enter API key (if needed)
4. Click "Test Connection"
5. Start using

**Your data:**
- Transcripts are not affected
- AI responses work with any provider
- Settings are saved locally

---

## Getting Help

- **Setup issues:** See [AI Providers Setup](./AI_PROVIDERS_SETUP.md) and [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
- **Troubleshooting:** See [Troubleshooting Guide](./TROUBLESHOOTING.md)
- **Questions:** See [FAQ](./FAQ.md)
