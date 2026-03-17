# Mobile Guide for Your Assistant

This guide covers all mobile-specific features, optimizations, and troubleshooting for Your Assistant.

## Table of Contents

- [Mobile Support Overview](#mobile-support-overview)
- [iOS Safari Support](#ios-safari-support)
- [Android Chrome Support](#android-chrome-support)
- [Mobile Session Management](#mobile-session-management)
- [Mobile Performance](#mobile-performance)
- [Mobile Troubleshooting](#mobile-troubleshooting)
- [Mobile-Specific Features](#mobile-specific-features)

---

## Mobile Support Overview

Your Assistant is fully optimized for mobile devices with comprehensive support for both iOS and Android.

### Supported Platforms

**iOS (iPhone/iPad)**:
- Safari (iOS 14.3+)
- Chrome for iOS (WebKit engine)
- Edge for iOS (WebKit engine)
- **Note**: Limited Web Speech API support on iOS Safari

**Android**:
- Chrome (full Web Speech API support)
- Edge (full Web Speech API support)
- Firefox (no Web Speech API support)
- Samsung Internet (limited support)

### Mobile-First Features

- **Touch-optimized interface** with 44px minimum touch targets
- **Tab-based navigation** for mobile screens
- **Fixed action bar** at bottom for easy access
- **Safe area handling** for notched devices
- **Auto-rotation support** (portrait and landscape)
- **Mobile session persistence** with automatic saving

---

## iOS Safari Support

### iOS-Specific Optimizations

#### Microphone Access
iOS Safari requires explicit microphone permission handling:

```javascript
// iOS Safari detection and handling
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

// Special handling for iOS microphone access
if (isIOS && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
  this.microphoneStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      sampleRate: 16000
    }
  })
}
```

#### Auto-Activation Prevention
iOS Safari prevents auto-activation for security:

- **No auto-start**: Users must manually tap "Start Session"
- **Session restoration**: Sessions restore on page load (within 1 hour)
- **Session clearing**: Sessions cleared after 1 hour of inactivity
- **Manual start required**: Prevents unwanted microphone access

#### WebSocket Fallbacks
iOS Safari has limited WebSocket support, so the app includes fallbacks for streaming:

- Automatic fallback to polling when WebSocket fails
- Graceful degradation for real-time features
- Optimized for iOS Safari limitations

### iOS Setup Requirements

1. **iOS Version**: iOS 14.3 or later required
2. **HTTPS Required**: iOS Safari requires HTTPS for microphone access
3. **Permissions**: Enable microphone in Settings > Safari
4. **Manual Start**: Always tap "Start Session" manually

### iOS Troubleshooting

#### "Microphone Permission Denied"
**Solutions**:
- Settings > Safari > Microphone → **Enable**
- Settings > Safari > Camera → **Enable** (sometimes required)
- Use HTTPS connection
- Tap "Start Session" directly (not through scripts)

#### "Speech Recognition Stops After 60 Seconds"
**Solutions**:
- Use Azure or Whisper provider for better iOS support
- Refresh page when recognition stops
- Use desktop browser for longer sessions

#### "Web Speech API Not Working"
**Solutions**:
- Update iOS to 14.3+
- Try Chrome for iOS (same WebKit limitations)
- Use cloud-based providers (Azure, Whisper, Deepgram)

---

## Android Chrome Support

### Android-Specific Optimizations

#### Full Web Speech API Support
Android Chrome provides complete Web Speech API support:

- **Real-time transcription**: Continuous speech recognition
- **Multiple languages**: Full language support
- **Background processing**: Works even when app is in background
- **High accuracy**: Google's speech recognition engine

#### Touch Interface Optimization
Android Chrome is optimized for touch interactions:

- **44px touch targets**: Meets Android accessibility guidelines
- **Prevent double-tap zoom**: Optimized for mobile interactions
- **Touch action optimization**: Prevents unwanted scrolling

#### Performance Optimizations
Android Chrome benefits from platform-specific optimizations:

- **Hardware acceleration**: Optimized for Android hardware
- **Memory management**: Efficient memory usage
- **Network optimization**: Optimized for mobile networks

### Android Setup

1. **Browser**: Use Chrome or Edge for best experience
2. **Permissions**: Grant microphone permission when prompted
3. **Updates**: Keep browser updated for latest features
4. **External mic**: Use external microphone for better quality

### Android Troubleshooting

#### "Microphone Permission Issues"
**Solutions**:
- Tap lock icon in address bar → Allow microphone
- Settings > Apps > Chrome > Permissions → Enable microphone
- Clear site data and refresh

#### "Poor Speech Recognition Quality"
**Solutions**:
- Use external microphone
- Speak clearly and consistently
- Switch to WiFi if using cellular data
- Use Azure or Whisper provider for better accuracy

---

## Mobile Session Management

### Session Persistence System

Mobile devices have a sophisticated session management system:

```javascript
// Mobile session management
const saveMobileSession = () => {
  if (!isMobile.value) return
  
  const session = {
    currentText: currentText.value,
    aiResult: ai_result.value,
    conversationHistory: conversationHistory.value,
    timestamp: Date.now(),
    state: state.value
  }
  localStorage.setItem(MOBILE_SESSION_KEY, JSON.stringify(session))
}
```

#### Session Features
- **Auto-save**: Every 5 seconds during active sessions
- **Auto-restore**: On page load (within 1 hour)
- **Auto-clear**: After 1 hour of inactivity
- **No auto-activation**: Users must manually start sessions

#### Session Data Structure
```javascript
{
  currentText: "transcript content",
  aiResult: "AI response content", 
  conversationHistory: "rolling history",
  timestamp: 1234567890,
  state: "ing" // or "end"
}
```

### Session Management Benefits

#### Automatic Recovery
- **Crash recovery**: Sessions restore after app crashes
- **Network recovery**: Sessions persist through network issues
- **Memory recovery**: Sessions survive browser memory cleanup

#### User Experience
- **No data loss**: Important content is automatically saved
- **Quick resume**: Users can quickly resume interrupted sessions
- **Peace of mind**: Users don't need to manually save progress

### Session Troubleshooting

#### "Session Not Restored"
**Solutions**:
- Check browser console for session restore messages
- Verify session timestamp is recent (< 1 hour)
- Clear localStorage if session is corrupted
- Refresh page to start fresh

#### "Session Lost"
**Solutions**:
- Copy important content before closing
- Sessions are not backed up externally
- Use desktop version for critical sessions
- Consider taking screenshots of important responses

---

## Mobile Performance

### Performance Optimizations

#### Memory Management
Mobile devices have platform-specific memory limits:

```javascript
// Platform-specific memory limits
const MOBILE_MAX_TRANSCRIPTION_LENGTH = 10000 // vs 15000 desktop
const MOBILE_MAX_AI_RESPONSE_LENGTH = 30000 // vs 50000 desktop
const MOBILE_CONTEXT_LIMIT = 50000 // vs 100000 desktop
```

#### Automatic Truncation
- **Transcript truncation**: Removes oldest content when limits exceeded
- **Response truncation**: Prevents memory issues with long responses
- **Context truncation**: Manages context size for optimal performance

#### Session Persistence Optimization
- **Incremental saving**: Only saves during active sessions
- **Session truncation**: Automatic cleanup of old session data
- **Memory management**: Prevents memory leaks on mobile devices

### Performance Monitoring

#### Mobile Performance Indicators
- **Smooth scrolling**: Hardware-accelerated scrolling
- **Responsive touch**: 44px minimum touch targets
- **Fast loading**: Optimized for mobile networks
- **Memory efficiency**: Automatic cleanup and truncation

#### Performance Issues
- **Slow scrolling**: Clear browser cache
- **Unresponsive touch**: Clean screen, restart browser
- **Memory issues**: Close other apps, restart device
- **Network issues**: Switch between WiFi and cellular

### Performance Best Practices

#### For Users
1. **Close other apps**: Free up memory for better performance
2. **Use WiFi**: More stable than cellular data
3. **Clear cache**: Regularly clear browser cache
4. **Restart device**: Periodically restart for optimal performance

#### For Developers
1. **Monitor memory usage**: Check for memory leaks
2. **Optimize network calls**: Minimize data usage
3. **Test on real devices**: Don't rely only on emulators
4. **Use performance profiling**: Identify bottlenecks

---

## Mobile Troubleshooting

### Common Mobile Issues

#### "Microphone Not Working"
**iOS Solutions**:
- Settings > Safari > Microphone → **Enable**
- Use HTTPS connection
- Tap "Start Session" manually

**Android Solutions**:
- Grant microphone permission in browser
- Check app permissions in Android settings
- Clear site data and refresh

#### "Poor Speech Recognition"
**Solutions**:
- Use external microphone
- Speak clearly and consistently
- Switch to cloud-based providers
- Check internet connection

#### "App Crashes or Freezes"
**Solutions**:
- Clear browser cache and cookies
- Close other browser tabs
- Restart device
- Use desktop version for complex tasks

#### "Touch Interface Unresponsive"
**Solutions**:
- Clean screen if dirty or wet
- Use different finger or stylus
- Restart browser
- Check for screen protector interference

### Mobile-Specific Debugging

#### Browser Console
To get detailed error information:

**iOS Safari**:
- Settings > Safari > Advanced > Web Inspector
- Connect to Mac and use Safari Developer Tools

**Android Chrome**:
- Enable USB debugging
- Use Chrome DevTools on connected computer

#### Mobile Debugging Tips
- **Check session logs**: Look for session save/restore messages
- **Monitor network requests**: Check for CORS errors
- **Test touch events**: Verify touch optimization is working
- **Monitor memory usage**: Check for memory leaks

### Getting Help

#### Diagnostic Information
When reporting mobile issues, include:
1. **Device Information**:
   - Device model and OS version
   - Browser name and version

2. **Error Details**:
   - Exact error messages
   - Steps to reproduce the issue

3. **Mobile-Specific Details**:
   - iOS version (for iOS users)
   - Session persistence behavior
   - Touch interface responsiveness

#### Support Channels
- [Main Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Web Speech API Tutorial](./WEB_SPEECH_API_TUTORIAL.md)
- [FAQ](./FAQ.md)
- [Architecture Guide](./ARCHITECTURE.md)

---

## Mobile-Specific Features

### Touch Interface

#### Touch Optimization
- **44px minimum targets**: Meets accessibility guidelines
- **Prevent double-tap zoom**: Optimized for mobile interactions
- **Touch action optimization**: Prevents unwanted scrolling
- **Large buttons**: Easy to tap with fingers

#### Mobile Navigation
- **Tab-based navigation**: Easy switching between speech and AI
- **Fixed action bar**: Always accessible at bottom
- **Gesture support**: Swipe gestures for navigation
- **Safe area handling**: Proper display on notched devices

### Mobile Layout

#### Responsive Design
- **Single-column layout**: Optimized for mobile screens
- **Auto-rotation**: Supports both portrait and landscape
- **Flexible panels**: Content adapts to screen size
- **Scroll optimization**: Smooth scrolling with `-webkit-overflow-scrolling`

#### Mobile-Specific Components
- **Mobile header**: Compact header with status indicators
- **Tab navigation**: Easy switching between speech and AI panels
- **Fixed action bar**: Always accessible controls
- **Context preview**: Mobile-optimized context display

### Mobile Performance Features

#### Platform-Specific Optimizations
- **Reduced memory usage**: Lower limits for mobile devices
- **Optimized scrolling**: Hardware-accelerated scrolling
- **Touch optimization**: Larger touch targets and optimized interactions
- **Network optimization**: Efficient API calls for mobile networks

#### Mobile Session Features
- **Auto-save**: Every 5 seconds during active sessions
- **Auto-restore**: On page load (within 1 hour)
- **Auto-clear**: After 1 hour of inactivity
- **No auto-activation**: Manual start required on iOS

### Mobile Security Features

#### iOS Safari Security
- **HTTPS requirement**: Required for microphone access
- **Explicit permissions**: Users must manually grant permissions
- **No auto-activation**: Prevents unwanted microphone access
- **Session isolation**: Sessions are isolated and secure

#### General Mobile Security
- **Local storage only**: No data sent to servers except providers
- **Secure transmission**: All API calls use HTTPS
- **Input validation**: Comprehensive URL and input validation
- **Privacy protection**: No data collection or tracking

---

## Mobile Provider Support

### Transcription Providers on Mobile

#### Web Speech API
- **iOS**: Limited support, 60-second limit
- **Android**: Full support, real-time transcription
- **Best for**: Quick testing, cost-free usage

#### Azure Speech Service
- **iOS**: Excellent support, no time limits
- **Android**: Excellent support, real-time transcription
- **Best for**: High accuracy, multi-language support

#### Whisper
- **iOS**: Excellent support, 5-second chunks
- **Android**: Excellent support, state-of-the-art accuracy
- **Best for**: Highest accuracy, multiple languages

#### Deepgram
- **iOS**: Excellent support, real-time streaming
- **Android**: Excellent support, lowest latency
- **Best for**: live sessions, low latency

### AI Providers on Mobile

All AI providers work equally well on mobile:
- **OpenAI**: GPT-3.5, GPT-4, GPT-4 Turbo
- **Z.ai**: GLM-4 series models
- **Ollama**: Local models (if server accessible)
- **MLX**: Apple Silicon local models (iOS only)
- **Anthropic**: Claude 3 models

---

## Mobile Development

### Mobile Development Setup

#### Local Development
```bash
# Start development server with HTTPS for iOS testing
npm run serve:https

# Test on mobile device
# 1. Connect device to same network
# 2. Use device IP address: https://[device-ip]:8080
# 3. Trust self-signed certificate on device
```

#### Mobile Testing
- **Real devices**: Always test on real devices, not just emulators
- **Network conditions**: Test on various network conditions
- **Battery impact**: Monitor battery usage during testing
- **Memory usage**: Check for memory leaks and performance issues

### Mobile Performance Testing

#### Performance Metrics
- **Load time**: Time to load and become interactive
- **Response time**: Time for user interactions to respond
- **Memory usage**: Monitor memory consumption over time
- **Battery impact**: Monitor battery drain during usage

#### Testing Tools
- **Chrome DevTools**: Performance profiling for Android
- **Safari Web Inspector**: Performance profiling for iOS
- **Mobile analytics**: Monitor real-world performance
- **Network throttling**: Test on various network conditions

---

## Mobile Best Practices

### For Users

#### Setup Best Practices
1. **Use recommended browsers**: Chrome for Android, Safari for iOS
2. **Grant permissions**: Allow microphone and camera access
3. **Use HTTPS**: Required for iOS microphone access
4. **Keep browser updated**: Latest features and security

#### Usage Best Practices
1. **Use external microphone**: Better audio quality
2. **Speak clearly**: Improves transcription accuracy
3. **Use WiFi**: More stable than cellular data
4. **Close other apps**: Free up memory for better performance

#### Maintenance Best Practices
1. **Clear cache regularly**: Prevents performance issues
2. **Restart browser**: Periodically restart for optimal performance
3. **Update browser**: Keep browser updated
4. **Monitor storage**: Ensure sufficient storage space

### For Developers

#### Development Best Practices
1. **Test on real devices**: Don't rely only on emulators
2. **Use HTTPS**: Required for many mobile features
3. **Optimize for touch**: Design for touch interactions
4. **Monitor performance**: Check for memory leaks and performance issues

#### Mobile-Specific Considerations
1. **Network variability**: Handle varying network conditions
2. **Battery impact**: Minimize battery drain
3. **Memory constraints**: Optimize memory usage
4. **Touch interactions**: Design for touch-friendly interfaces

---

## Mobile Troubleshooting

### Common Mobile Issues

#### Website Fetching Fails or Times Out

**Symptoms:**
- "Failed to fetch website after trying multiple CORS proxies" error
- Request hangs or times out
- Works on desktop but not on mobile

**Causes & Solutions:**

1. **Network Connection Issues**
   - Switch to a more stable network
   - Try WiFi instead of mobile data
   - Timeout is 30 seconds on mobile (vs 20s on desktop)

2. **CORS Proxy Blocking**
   - Wait a few minutes and try again
   - App tries 3 different proxies automatically
   - Check browser console for specific error messages

3. **iOS Safari Limitations**
   - Use Safari 14.1+ or Chrome on iOS
   - Check Settings > Safari > Advanced > Experimental Features
   - Try Chrome or Firefox instead

4. **Android Browser Issues**
   - Use Chrome, Firefox, or Samsung Internet Browser
   - Update browser to latest version
   - Avoid built-in WebView browsers

5. **Website Blocking Mobile Access**
   - Try a different website to test
   - Some sites require JavaScript (won't work through proxies)
   - Manually copy/paste content instead

#### Speech Recognition Issues

**Symptoms:**
- Web Speech API not working
- "Microphone access denied" error
- Transcription stops unexpectedly

**Solutions:**

1. **iOS Safari (Web Speech API)**
   - Works best in Safari 14.1+
   - Requires HTTPS connection
   - May require user interaction to start
   - 60-second limit per transcription

2. **Android (Web Speech API)**
   - Works in Chrome and Samsung Internet
   - More reliable than iOS Safari
   - Requires HTTPS for first use
   - May show microphone permission prompt

3. **Alternative: Use Different Provider**
   - Switch to Azure Speech (best mobile support)
   - Use Deepgram (lowest latency)
   - Use Whisper (highest accuracy)

#### Microphone Permission Denied

**iOS Safari:**
1. Settings > Safari > Camera & Microphone
2. Find your assistant in the list
3. Change from "Deny" to "Allow"

**Android Chrome:**
1. Open Chrome Settings (three dots)
2. Site Settings > Microphone
3. Allow microphone access

#### Overlay Mode Issues

**Document Picture-in-Picture Not Available:**
- Requires Chrome 116+ or Edge 116+
- Check if browser supports Picture-in-Picture API
- Try CSS mini-mode overlay instead

**Overlay Can't Be Moved:**
- Use drag handle at the top of overlay
- Works best in Chrome/Edge browsers
- Safari may have limited support

#### Auto Mode Not Triggering

**Common Issues:**

1. **Silence Detection Too Short/Long**
   - Adjust trigger delay in Settings > Speech
   - Range: 500ms to 8000ms (default: 2500ms)

2. **Screenshot Not Capturing**
   - Electron app: No permission needed
   - Browser: Permission required each time
   - Check browser console for errors

3. **Pixel Change Threshold**
   - Adjust in Settings > Speech
   - Range: 0.01 to 0.2 (default: 0.05)
   - Lower = more sensitive, higher = less sensitive

### Error Messages Explained

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Request timeout" | Proxy took too long | Try again or use different network |
| "HTTP 403" | Website/proxy blocked request | Try different website |
| "HTTP 429" | Rate limit exceeded | Wait a few minutes |
| "Received empty or invalid response" | Proxy returned no content | Try different proxy (automatic) |
| "Could not extract meaningful content" | Website structure not parseable | Website may require JavaScript |
| "Microphone access denied" | Browser blocked microphone | Grant permission in browser settings |
| "Web Speech API not supported" | Browser doesn't support speech | Use Chrome/Safari or switch provider |

### Testing Steps

1. **Test with a simple website:**
   - `https://example.com`

2. **Check browser console for errors:**
   - iOS Safari: Settings > Safari > Advanced > Web Inspector
   - Android Chrome: `chrome://inspect`

3. **Verify network connectivity:**
   - Open other websites in browser
   - Switch between WiFi and mobile data
   - Try a different network

4. **Test transcription:**
   - Allow microphone access when prompted
   - Speak clearly and at normal volume
   - Check if transcription appears in real-time

### Still Having Issues?

1. **Alternative Approaches:**
   - Manually copy/paste content instead of website fetching
   - Use desktop version if possible (fewer restrictions)
   - Switch to different transcription provider

2. **Report the Issue:**
   - Note your device (iPhone 14, Samsung Galaxy S21, etc.)
   - Note your browser (Safari 16, Chrome 120, etc.)
   - Include specific error messages from console
   - Describe what you were trying to do

## Mobile Feature Reference

### Mobile-Specific Features Summary

| Feature | iOS | Android | Description |
|---------|-----|---------|-------------|
| Web Speech API | Limited | Full | Browser speech recognition |
| Session Persistence | Yes | Yes | Auto-save and restore |
| Touch Interface | Yes | Yes | Optimized for touch |
| HTTPS Required | Yes | No | iOS security requirement |
| Auto-Activation | No | Yes | iOS prevents auto-start |
| WebSocket Support | Limited | Full | Real-time features |
| Performance | Optimized | Optimized | Platform-specific tuning |

### Mobile Provider Compatibility

| Provider | iOS | Android | Notes |
|----------|-----|---------|-------|
| Web Speech API | Limited | Full | 60s limit on iOS |
| Azure Speech | Full | Full | Best iOS support |
| Whisper | Full | Full | State-of-the-art accuracy |
| Deepgram | Full | Full | Lowest latency |
| OpenAI | Full | Full | All models supported |
| Z.ai | Full | Full | Chinese language support |
| Ollama | Limited | Limited | Requires local server |
| MLX | Full | No | Apple Silicon only |
| Anthropic | Full | Full | Claude 3 models |

---

This comprehensive mobile guide covers all aspects of using Your Assistant on mobile devices, from setup and troubleshooting to performance optimization and development best practices.