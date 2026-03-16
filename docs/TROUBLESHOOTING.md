# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with Your Assistant.

## Table of Contents

- [General Issues](#general-issues)
- [AI Provider Issues](#ai-provider-issues)
- [Transcription Provider Issues](#transcription-provider-issues)
- [Browser-Specific Issues](#browser-specific-issues)
- [Network Issues](#network-issues)
- [Performance Issues](#performance-issues)
- [Getting Help](#getting-help)

---

## General Issues

### Application Won't Load

**Symptoms**: Blank page, loading spinner, or error messages

**Solutions**:
1. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete → Clear "Cached images and files"
   - Edge: Ctrl+Shift+Delete → Clear "Cached images and files"
   - Safari: Cmd+Option+E

2. **Check Browser Console**
   - Press F12 to open Developer Tools
   - Look for red error messages in Console tab
   - Copy errors when asking for help

3. **Try Different Browser**
   - Chrome or Edge recommended
   - Some features may not work in Firefox or Safari

4. **Check Internet Connection**
   - Ensure you have a stable connection
   - Try loading other websites

### Settings Won't Save

**Symptoms**: Configuration changes disappear after refresh

**Solutions**:
1. **Check localStorage**
   - Open DevTools Console (F12)
   - Type: `localStorage`
   - Verify items are stored
   - If empty, your browser may be blocking localStorage

2. **Enable Cookies/Storage**
   - Chrome: Settings → Privacy and security → Site Settings → Cookies
   - Edge: Settings → Cookies and site permissions → Manage cookies
   - Ensure storage is allowed for the site

3. **Check Browser Extensions**
   - Disable privacy/ad-blocker extensions temporarily
   - Some extensions block localStorage

4. **Incognito/Private Mode**
   - Settings may not persist in private browsing mode
   - Use normal browsing mode

---

## AI Provider Issues

### "API Key Invalid"

**Symptoms**: Error message about invalid API key

**Solutions**:
1. **Verify API Key**
   - Check for extra spaces before/after the key
   - Ensure you copied the entire key
   - Regenerate key if needed

2. **Check Key is Active**
   - Open provider's dashboard (OpenAI, Z.ai, etc.)
   - Verify the key hasn't been revoked
   - Check account status/payment method

3. **Check Key Type**
   - Ensure you're using the correct type of key
   - Some providers have test vs. production keys
   - Verify key has required permissions

### "Failed to Fetch" / Network Error

**Symptoms**: Unable to connect to AI provider

**Solutions**:
1. **Check Internet Connection**
   - Verify you're online
   - Try loading provider's website in a new tab

2. **CORS Issues**
   - Check browser console for CORS errors
   - Some providers may require a proxy server
   - Try disabling VPN or proxy

3. **Provider Service Status**
   - Check provider's status page
   - Verify service isn't experiencing outages
   - Examples:
     - OpenAI: https://status.openai.com
     - Anthropic: https://status.anthropic.com

4. **Endpoint URL**
   - Verify endpoint URL is correct
   - Check for typos in the endpoint
   - Try default endpoint

### "Quota Exceeded" / Rate Limiting

**Symptoms**: Error about usage limits or quotas

**Solutions**:
1. **Check Usage Dashboard**
   - Open provider's dashboard
   - Review current usage
   - Check if you've hit limits

2. **Upgrade Plan**
   - Free tiers have limits
   - Consider upgrading to paid plan
   - Compare pricing options

3. **Wait and Retry**
   - Some limits reset hourly/daily
   - Wait before trying again

4. **Use Different Provider**
   - Switch to a different AI provider
   - Use local options (Ollama, MLX)

### Model Not Found

**Symptoms**: Error about unavailable model

**Solutions**:
1. **Verify Model Name**
   - Check model name spelling
   - Use exact model name (case-sensitive)
   - Refer to provider's documentation

2. **Check Model Availability**
   - Some models require specific subscriptions
   - Verify your account has access to the model
   - Check provider's model list

3. **Use Default Model**
   - Try provider's default model
   - Common defaults: `gpt-3.5-turbo`, `glm-4.7`

---

## Transcription Provider Issues

### Microphone Not Working

**Symptoms**: "No speech detected" or microphone errors

**Solutions**:
1. **Grant Microphone Permission**
   - Click the lock/info icon in address bar
   - Set microphone to "Allow"
   - Refresh the page

2. **Check System Settings**
   - Verify microphone isn't muted
   - Check system volume levels
   - Test microphone in system settings

3. **Try Different Microphone**
   - Use external microphone instead of built-in
   - Check if microphone is plugged in properly
   - Test with a different audio input device

4. **Close Other Apps**
   - Close other apps using the microphone
   - Only one app can use microphone at a time
   - Check for video conferencing apps (Zoom, Teams, etc.)

### Web Speech API Network Error

**Symptoms**: "Network error" when using Web Speech API

**Solutions**:
1. **Use Diagnostic Tool**
   - Open `http://localhost:8080/speech-test.html`
   - Run all 5 tests
   - Review diagnostic summary

2. **Disable VPN/Proxy**
   - VPNs often block Google's speech service
   - Temporarily disable VPN
   - Try without proxy

3. **Try Different Network**
   - Corporate networks may block the service
   - Try home network instead of work
   - Use mobile hotspot if needed

4. **Try Different Browser**
   - Try Chrome instead of Edge (or vice versa)
   - Web Speech API works best in Chromium browsers

5. **Check Internet Connection**
   - Verify you can reach Google services
   - Try loading https://www.google.com

6. **Use Different Provider**
   - If Web Speech API doesn't work, switch to:
     - Azure (5 free hours/month)
     - Deepgram (200 free hours/month)
     - Whisper (paid, but very accurate)

### Azure Speech Issues

**Symptoms**: Azure transcription fails or errors

**Solutions**:
1. **Verify API Key and Region**
   - Double-check the API key
   - Ensure region matches your resource location
   - Common regions: `eastasia`, `westus`, `northeurope`

2. **Check Azure Subscription**
   - Verify Speech service is active
   - Check if free tier hours are exhausted
   - Ensure subscription hasn't expired

3. **Test Connection**
   - Use "Test Connection" button in Settings
   - Review error messages
   - Check browser console for details

4. **Region Selection**
   - Choose region closest to you
   - Some regions may have better availability
   - Try a different region if needed

### Deepgram Issues

**Symptoms**: Deepgram transcription fails

**Solutions**:
1. **Verify API Key**
   - Check API key is correct
   - Ensure key hasn't been revoked
   - Generate new key if needed

2. **WebSocket Connection**
   - Check if firewall blocks WebSocket
   - Verify network allows WebSocket connections
   - Try different network

3. **Free Tier Limits**
   - Free tier: 200 hours per month
   - Check usage on Deepgram dashboard
   - Upgrade if limits exceeded

4. **Model Selection**
   - Use `nova-2` for best results
   - Ensure model is available
   - Try different model

### Whisper Issues

**Symptoms**: Whisper transcription fails

**Solutions**:
1. **Check OpenAI API Key**
   - Verify API key is valid
   - Ensure key has Whisper access
   - Check account balance/usage

2. **5-Second Delay**
   - Whisper processes in 5-second chunks
   - This is normal behavior
   - Wait for transcription to appear

3. **File Size Limits**
   - Ensure audio chunks are within size limits
   - Check OpenAI documentation for limits
   - May need to adjust chunk size

---

## Browser-Specific Issues

### Chrome/Edge (Recommended)

**Best compatibility** with all features.

**Issues**:
- Web Speech API works best
- All providers supported

### Firefox

**Limited support** for some features.

**Issues**:
- Web Speech API NOT supported
- Some providers may have CORS issues
- Use Chrome/Edge instead

### Safari

**Limited support** for some features.

**Issues**:
- Web Speech API NOT supported
- MediaRecorder may have limitations
- Use Chrome/Edge instead

### Mobile Browsers

**Varied support**.

**Issues**:
- Microphone permissions may be tricky
- Some providers may not work
- Test thoroughly before using in sessions

### Website Fetch: URL Blocked / SSRF Validation Error

**Symptoms**: "Access to internal/private network resources is not allowed" when entering a URL

**Cause**: The URL validation layer rejected the URL to prevent SSRF attacks.

**Solutions**:
1. **Use a public `https://` URL** — only public HTTP/HTTPS URLs are accepted
2. **Blocked patterns** (by design, cannot be bypassed):
   - `localhost`, `127.x.x.x`, `0.0.0.0`, `::1`
   - Private ranges: `10.x`, `172.16–31.x`, `192.168.x`
   - Link-local / metadata: `169.254.x`
   - Non-HTTP protocols (`file://`, `ftp://`, etc.)
3. **Encoded IPs** (octal, hex, decimal integer) are also blocked

### Website Fetch: CORS Proxy Errors

**Symptoms**: All CORS proxies fail when fetching a website

**Solutions**:
1. **Check internet connection** — all three proxies are external services
2. **Try a different URL** — some sites block proxy access
3. **Run the diagnostic tool** in the browser console:
   ```javascript
   // Paste in DevTools Console (F12)
   diagnoseWebsiteFetching('https://example.com')
   ```
   This tests each proxy individually and reports status, timing, and content.
4. **VPN/firewall** — disable VPN or whitelist the proxy domains:
   - `api.allorigins.win`
   - `corsproxy.io`
   - `api.codetabs.com`

---

## Electron Issues

### Security Warning: Non-Default BrowserWindow Settings

**Symptoms**: Electron prints a security warning about `nodeIntegration`, `contextIsolation`, or `webSecurity`

**Cause**: `electron/main.js` creates a `BrowserWindow` with settings that deviate from Electron's secure defaults.

**What to check**:
- `contextIsolation` must be `true` (default) — disabling it allows renderer code to access Node.js directly
- `nodeIntegration` must be `false` (default) — enabling it is a known XSS-to-RCE vector
- `webSecurity` must be `true` (default) — disabling it removes same-origin protections

All renderer ↔ main communication should go through the context bridge in `electron/preload.js` via `window.electronAPI`.

**Reference**: [Electron Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security#checklist-security-recommendations)

---

### VPN/Proxy Blocking

**Symptoms**: Connection failures, network errors

**Solutions**:
1. **Temporarily Disable VPN**
   - VPNs often block AI/transcription services
   - Try without VPN
   - Add exceptions if needed

2. **Configure Proxy**
   - Some proxies block WebSocket connections
   - Whitelist required domains
   - Try without proxy

3. **Corporate Networks**
   - May block certain services
   - Contact IT for exceptions
   - Use mobile hotspot as workaround

### Firewall Blocking

**Symptoms**: Connection timeouts, unable to reach services

**Solutions**:
1. **Check Firewall Settings**
   - Allow outgoing HTTPS connections
   - Allow WebSocket connections (for Deepgram)
   - Whitelist provider domains

2. **Required Domains**
   - OpenAI: `api.openai.com`
   - Z.ai: `api.z.ai`
   - Azure: `*.cognitiveservices.azure.com`
   - Deepgram: `api.deepgram.com`
   - Web Speech API: Google's speech service

### CORS Errors

**Symptoms**: CORS errors in browser console

**Solutions**:
1. **Check Provider CORS Policy**
   - Some providers don't allow browser requests
   - May need a proxy server
   - Use providers with browser support

2. **Use CORS Proxy** (advanced)
   - Set up a proxy server
   - Route requests through proxy
   - Configure endpoint accordingly

3. **Switch Providers**
   - Use providers with better CORS support
   - OpenAI, Z.ai generally work well
   - Azure may require proxy in some cases

---

## Performance Issues

### Slow Transcription

**Symptoms**: Long delays in transcription

**Solutions**:
1. **Choose Faster Provider**
   - Web Speech API: Fastest (real-time)
   - Deepgram: Very fast (200-300ms)
   - Azure: Fast (300-500ms)
   - Whisper: Slower (5-second chunks)

2. **Check Internet Speed**
   - Run speed test
   - Ensure stable connection
   - Use wired connection if possible

3. **Close Other Tabs**
   - Too many tabs can slow browser
   - Close unused tabs
   - Restart browser

### Slow AI Responses

**Symptoms**: Long delays in AI responses

**Solutions**:
1. **Choose Faster Model**
   - GPT-3.5 Turbo: Fast
   - Claude Haiku: Very fast
   - GPT-4: Slower but higher quality
   - GLM-4.7: Good balance

2. **Use Streaming**
   - All providers support streaming
   - Responses appear in real-time
   - Faster perceived performance

3. **Check Internet Connection**
   - Slow connection affects AI providers
   - Run speed test
   - Use faster network if available

### High CPU/Memory Usage

**Symptoms**: Browser lag, high resource usage

**Solutions**:
1. **Close Other Tabs**
   - Free up system resources
   - Only keep Your Assistant open

2. **Use Local Providers**
   - Ollama/MLX use system resources
   - Cloud providers use less browser resources
   - Choose based on your system

3. **Restart Browser**
   - Memory leaks can occur
   - Restart periodically
   - Clear cache

---

## Getting Help

### Diagnostic Information

When asking for help, provide:

1. **Browser and Version**
   - Chrome/Edge/Firefox/Safari
   - Version number

2. **Operating System**
   - Windows/Mac/Linux
   - Version

3. **Provider Configuration**
   - AI Provider being used
   - Transcription Provider being used
   - Model names

4. **Error Messages**
   - Copy exact error text
   - Include browser console errors
   - Screenshot if helpful

5. **Steps to Reproduce**
   - What you were doing
   - What you expected to happen
   - What actually happened

### Browser Console

Always check browser console for errors:

1. **Open Console**
   - Press F12
   - Go to Console tab
   - Look for red errors

2. **Copy Errors**
   - Right-click error → Copy
   - Include in support requests

3. **Check Network Tab**
   - Failed requests appear here
   - Check status codes
   - Review request/response

### Built-in Diagnostics

**Web Speech API**:
- Use `speech-test.html` diagnostic tool
- Run all 5 tests
- Review diagnostic summary

**Connection Tests**:
- Use "Test Connection" buttons
- Review test results
- Check error messages

### Where to Get Help

1. **Documentation**
   - [AI Providers Setup](./AI_PROVIDERS_SETUP.md)
   - [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
   - [Azure Tutorial](./AZURE_SERVICE_TUTORIAL.md)

2. **Provider Documentation**
   - OpenAI: https://platform.openai.com/docs
   - Z.ai: https://z.ai
   - Azure: https://docs.microsoft.com/azure/cognitive-services/speech-service/
   - Deepgram: https://developers.deepgram.com

3. **GitHub Issues**
   - Search existing issues first
   - Create new issue with details
   - Include diagnostic information

4. **Community**
   - Check discussions
   - Ask questions
   - Share solutions

---

## Quick Reference

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "API key invalid" | Wrong or expired key | Verify/regenerate key |
| "Network error" | Can't reach service | Check internet, disable VPN |
| "Microphone not allowed" | Permission denied | Grant microphone permission |
| "Quota exceeded" | Hit usage limits | Upgrade plan or wait |
| "Model not found" | Wrong model name | Check model spelling/availability |
| "CORS error" | Browser restriction | Try different provider or proxy |

### Emergency Switches

If something isn't working, try these:

**Transcription Not Working?**
1. Switch to Web Speech API (free, no setup)
2. Switch to Azure (reliable, 5 free hours)
3. Switch to Deepgram (200 free hours)

**AI Not Working?**
1. Switch to OpenAI (most reliable)
2. Switch to Z.ai (good alternative)
3. Check API key is valid

**Everything Broken?**
1. Refresh the page
2. Clear browser cache
3. Try different browser (Chrome/Edge)
4. Check internet connection

---

For more information:
- [README](../README.md)
- [AI Providers Setup](./AI_PROVIDERS_SETUP.md)
- [Transcription Providers Setup](./TRANSCRIPTION_PROVIDERS_SETUP.md)
