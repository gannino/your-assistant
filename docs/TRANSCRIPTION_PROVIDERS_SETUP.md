# Transcription Providers Setup Guide

This guide walks you through setting up each transcription provider available in Your Assistant.

## Table of Contents

- [Azure Speech Service](#azure-speech-service)
- [OpenAI Whisper](#openai-whisper)
- [Web Speech API](#web-speech-api)
- [Deepgram](#deepgram)
- [Choosing the Right Provider](#choosing-the-right-provider)
- [Troubleshooting](#troubleshooting)

---

## Azure Speech Service

### Overview
- **API Key Required**: Yes
- **Languages**: 100+ languages supported
- **Latency**: Low
- **Best For**: High accuracy, multi-language support, free tier available

### Setup Steps

1. **Get Azure Speech Service Key**
   - Follow the [Azure Speech Service Tutorial](./AZURE_SERVICE_TUTORIAL.md)
   - Create a free Azure account
   - Create a Speech resource
   - Get your API Key and Region

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Azure" as Transcription Provider
   - Enter your Azure Token (API Key)
   - Select your Region (e.g., `eastasia`, `westus`, `northeurope`)
   - Choose Language (e.g., `en-US`, `zh-CN`)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify you see a success message

### Supported Languages
Popular languages include:
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `zh-CN` - Chinese (Mandarin)
- `es-ES` - Spanish
- `fr-FR` - French
- `de-DE` - German
- `ja-JP` - Japanese
- `ko-KR` - Korean

### Pricing
- **Free Tier**: 5 hours per month
- **Standard (S0)**: ~$1 per hour
- Check [Azure Speech Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/) for details

### Pros & Cons
✅ High accuracy across many languages
✅ Free tier available (5 hours/month)
✅ Low latency
✅ Excellent for technical terms
❌ Requires Azure account
❌ Free tier limited to 5 hours/month

---

## OpenAI Whisper

### Overview
- **API Key Required**: Yes
- **Languages**: 50+ languages
- **Latency**: Medium (5-second chunks)
- **Best For**: Highest accuracy, multiple languages, simple setup

### Setup Steps

1. **Get OpenAI API Key**
   - Visit https://platform.openai.com
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Whisper" as Transcription Provider
   - Enter your OpenAI API Key
   - Choose Model (recommended: `whisper-1`)
   - Select Language (e.g., `en`, `zh`, `es`)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify configuration is valid

### How It Works
- Records audio in 5-second chunks
- Transcribes each chunk via Whisper API
- Appends transcriptions to the transcript in real-time
- Slight delay (~5 seconds) but very accurate

### Supported Languages
Common language codes:
- `en` - English
- `zh` - Chinese
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `ko` - Korean

### Pricing
- **Whisper Large**: $0.006 per minute
- **Whisper Small**: $0.006 per minute
- Check [OpenAI Pricing](https://openai.com/pricing) for current rates

### Pros & Cons
✅ State-of-the-art accuracy
✅ Excellent for multiple languages
✅ Handles background noise well
✅ Simple API key setup
❌ Requires paid API key
❌ 5-second delay per chunk
❌ Can be expensive for long sessions

---

## Deepgram

### Overview
- **API Key Required**: Yes
- **Languages**: 30+ languages
- **Latency**: Very low (real-time streaming)
- **Best For**: Live sessions, low latency, real-time applications

### Setup Steps

1. **Get Deepgram API Key**
   - Visit https://deepgram.com
   - Sign up for an account
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key

2. **Configure in Your Assistant**
   - Open Settings
   - Select "Deepgram" as Transcription Provider
   - Enter your Deepgram API Key
   - Choose Model (recommended: `nova-2`)
   - Select Language (e.g., `en`, `zh`, `es`)

3. **Test Connection**
   - Click "Test Connection" button
   - Verify configuration is valid

### How It Works
- Uses WebSocket for real-time streaming
- Audio sent continuously in small chunks
- Transcription returned in real-time
- Very low latency (~200-300ms)

### Available Models
- **Nova-2**: Best accuracy, recommended (default)
- **Nova**: Balanced speed/accuracy
- **Enhanced**: Legacy model

### Supported Languages
Popular languages include:
- `en` - English
- `zh` - Chinese
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `ko` - Korean

### Pricing
- **Free Tier**: 200 hours per month (limited features)
- **Pay-as-you-go**: $0.009 per minute
- Check [Deepgram Pricing](https://deepgram.com/pricing) for details

### Pros & Cons
✅ Lowest latency (real-time)
✅ Excellent accuracy
✅ Generous free tier (200 hours)
✅ Great for live sessions
❌ Requires API key (but free tier available)
❌ WebSocket connection complexity

---

## Web Speech API

### Overview
- **API Key Required**: No (FREE)
- **Languages**: Browser-dependent (typically 20-50 languages)
- **Latency**: Very low
- **Best For**: Quick testing, cost-free usage, Chrome/Edge users

### Setup Steps

1. **Configure in Your Assistant**
   - Open Settings
   - Select "Web Speech" as Transcription Provider
   - Choose Language (e.g., `en-US`, `zh-CN`)
   - No API key required!

2. **Test Connection**
   - Click "Test Connection" button
   - Allow microphone permissions when prompted
   - Verify service is reachable

3. **Start Using**
   - Click "Start Session"
   - Allow microphone access if prompted
   - Begin speaking!

### Browser Requirements
- **Supported Browsers**: Chrome, Edge (Chromium-based)
- **Not Supported**: Firefox, Safari (desktop)
- **Mobile**: Chrome Android, Edge Android

### iOS Safari Support

**Important iOS Notes:**
- iOS Safari has **limited Web Speech API support**
- Speech recognition may stop after ~60 seconds (browser limitation)
- Requires explicit microphone permission
- HTTPS required for microphone access

**iOS Setup:**
1. **Enable Microphone Access**
   - Settings > Safari > Microphone → **Enable**
   - Settings > Safari > Camera → **Enable** (sometimes required)

2. **Use HTTPS**
   - iOS Safari requires HTTPS for microphone access
   - Use `npm run serve:https` for development
   - Online demo uses HTTPS automatically

3. **Permission Handling**
   - Tap "Start Session" directly (not through scripts)
   - Allow microphone permission when prompted
   - If permission denied, refresh page and try again

### How It Works
- Uses browser's built-in speech recognition
- Powered by Google's speech service (in Chrome/Edge)
- Requires internet connection
- Continuous real-time transcription

### Troubleshooting Web Speech API

**"Network error"**
- Cause: Cannot reach Google's speech servers
- Solutions:
  - Check your internet connection
  - Disable VPN or proxy
  - Try a different network (home vs. work)
  - Check firewall settings
  - Try Chrome instead of Edge (or vice versa)

**"Not allowed" error**
- Cause: Microphone permission denied
- Solution: Allow microphone access in browser settings

**"iOS Safari: Speech recognition stopped"**
- Cause: iOS Safari browser limitation
- Solutions:
  - Use Azure or Whisper provider for better iOS support
  - Try refreshing the page
  - Ensure you're using HTTPS
  - Check microphone permissions in iOS Settings

For detailed troubleshooting, use the diagnostic tool:
- Open `http://localhost:8080/speech-test.html` when dev server is running
- Run all 5 tests to diagnose the issue

### Pros & Cons
✅ Completely FREE
✅ No setup required
✅ Very low latency
✅ Real-time continuous transcription
❌ Requires internet connection
❌ Chrome/Edge only
❌ May have network issues in some regions
❌ Lower accuracy than paid options
❌ iOS Safari has limited support

---

## Choosing the Right Provider

### For Beginners
**Web Speech API** - No setup required, completely free

### For Best Accuracy
**Whisper** - State-of-the-art accuracy, handles noise well

### For live sessions
**Deepgram** - Lowest latency, real-time streaming

### For Multiple Languages
**Azure** - Best multi-language support with 100+ languages

### For Free Usage
1. **Web Speech API** - Completely free, no limits
2. **Deepgram** - 200 free hours per month
3. **Azure** - 5 free hours per month

### For Chinese Language
1. **Azure** - Excellent Chinese support
2. **Whisper** - Good accuracy for Chinese
3. **Web Speech API** - Works well in Chrome China

### For Cost-Effective Production Use
**Deepgram** - Best balance of price, performance, and free tier

### For Enterprise Use
**Azure** - Reliable, scalable, with SLA guarantees

---

## Language Support Comparison

| Language | Azure | Whisper | Web Speech | Deepgram |
|----------|-------|---------|------------|----------|
| English  | ✅     | ✅       | ✅          | ✅        |
| Chinese  | ✅     | ✅       | ✅          | ✅        |
| Spanish  | ✅     | ✅       | ✅          | ✅        |
| French   | ✅     | ✅       | ✅          | ✅        |
| German   | ✅     | ✅       | ✅          | ✅        |
| Japanese | ✅     | ✅       | ✅          | ✅        |
| Korean   | ✅     | ✅       | ✅          | ✅        |

---

## Accuracy Comparison

Based on general testing (varies by audio quality):

1. **Whisper** - 95-98% accuracy (best overall)
2. **Azure** - 90-95% accuracy (excellent for clear speech)
3. **Deepgram Nova-2** - 90-95% accuracy (great for live use)
4. **Web Speech API** - 85-90% accuracy (good for free option)

---

## Latency Comparison

Lower is better:

1. **Web Speech API** - < 100ms (real-time)
2. **Deepgram** - 200-300ms (near real-time)
3. **Azure** - 300-500ms (low)
4. **Whisper** - ~5000ms (5-second chunks)

---

## Troubleshooting

### Common Issues Across All Providers

**"Microphone not allowed"**
- Grant microphone permission in browser settings
- Check if another app is using the microphone
- Try refreshing the page

**"No speech detected"**
- Speak clearly and closer to the microphone
- Check microphone volume in system settings
- Try a different microphone (external vs built-in)

**"Transcription stopped unexpectedly"**
- Check internet connection (for cloud providers)
- Verify API key is valid
- Check browser console for detailed errors

### Provider-Specific Issues

**Azure: "Subscription key is invalid"**
- Verify the API key is correct
- Check you're using the right region
- Ensure the Speech service is active in Azure portal

**Whisper: "Quota exceeded"**
- Check your OpenAI usage limits
- Add payment method to OpenAI account
- Consider using a different provider

**Web Speech API: "Network error"**
- Use the diagnostic tool: `speech-test.html`
- Try disabling VPN
- Switch to a different network
- Try Chrome instead of Edge (or vice versa)

**Deepgram: "WebSocket connection failed"**
- Verify API key is correct
- Check firewall isn't blocking WebSocket connections
- Ensure Deepgram service is operational

---

## Diagnostic Tools

### Web Speech API Diagnostic Tool

If Web Speech API isn't working, use the built-in diagnostic tool:

1. Start the dev server: `npm run serve`
2. Open: `http://localhost:8080/speech-test.html`
3. Run all 5 tests:
   - Test 1: Browser Support Check
   - Test 2: Microphone Permission
   - Test 3: Basic Speech Recognition
   - Test 4: Network Connectivity
   - Test 5: Continuous Recognition
4. Review the diagnostic summary
5. Follow suggested solutions

### Browser Console

Always check the browser console for detailed error messages:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Copy error messages when asking for help

---

## Migration Guide

### Switching Between Providers

You can switch providers at any time:

1. Open Settings
2. Select a different Transcription Provider
3. Configure the new provider (if needed)
4. Click "Test Connection" to verify
5. Start Session with the new provider

### Data Portability

- All providers use the same transcript format
- Switching providers doesn't affect your existing transcripts
- AI responses work with any transcription provider

---

## Security & Privacy

### Data Handling

**Azure**
- Audio sent to Microsoft servers
- Transient processing (not stored)
- Microsoft privacy policy applies

**Whisper**
- Audio sent to OpenAI servers
- Transient processing (not stored)
- OpenAI privacy policy applies

**Web Speech API**
- Audio sent to Google servers (via browser)
- Transient processing (not stored)
- Google privacy policy applies

**Deepgram**
- Audio sent to Deepgram servers
- Transient processing (not stored)
- Deepgram privacy policy applies

### Best Practices

1. **Review Privacy Policies** - Understand how each provider handles data
2. **Use Secure Connections** - All providers use HTTPS
3. **Be Aware of Processing** - Audio is processed in the cloud (except local setup)
4. **Enterprise Considerations** - Check if your organization approves specific providers

---

For more information, see:
- [AI Providers Setup](./AI_PROVIDERS_SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Azure Speech Tutorial](./AZURE_SERVICE_TUTORIAL.md)
