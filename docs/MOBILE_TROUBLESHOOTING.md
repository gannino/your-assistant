# Mobile Website Fetching Troubleshooting Guide

## Common Issues on Mobile Devices

### Issue: Website fetching fails or times out on mobile

**Symptoms:**
- "Failed to fetch website after trying multiple CORS proxies" error
- Request hangs or times out
- Works on desktop but not on mobile

**Causes & Solutions:**

#### 1. Network Connection Issues
- **Problem**: Mobile data or WiFi connection is slow/unstable
- **Solution**: 
  - Switch to a more stable network
  - Try WiFi instead of mobile data
  - The timeout is set to 30 seconds on mobile (vs 20s on desktop)

#### 2. CORS Proxy Blocking
- **Problem**: Some CORS proxies may block mobile user agents or have rate limits
- **Solution**: 
  - Wait a few minutes and try again
  - The app tries 3 different proxies automatically
  - Check browser console for specific error messages

#### 3. iOS Safari Limitations
- **Problem**: iOS Safari has stricter security policies
- **Solution**:
  - Make sure you're using Safari 14.1+ or Chrome on iOS
  - Check Settings > Safari > Advanced > Experimental Features
  - Try using Chrome or Firefox on iOS instead

#### 4. Android Browser Issues
- **Problem**: Some Android browsers have limited fetch API support
- **Solution**:
  - Use Chrome, Firefox, or Samsung Internet Browser
  - Update your browser to the latest version
  - Avoid using built-in WebView browsers

#### 5. Website Blocking Mobile Access
- **Problem**: Target website blocks automated/proxy access
- **Solution**:
  - Try a different website to test
  - Some websites require JavaScript and won't work through proxies
  - Consider manually copying content instead

## Testing Steps

1. **Test with a simple website first:**
   ```
   https://example.com
   ```

2. **Check browser console for errors:**
   - iOS Safari: Settings > Safari > Advanced > Web Inspector
   - Android Chrome: chrome://inspect

3. **Verify network connectivity:**
   - Open other websites in browser
   - Check if you can access the CORS proxy directly:
     - https://api.allorigins.win/
     - https://corsproxy.io/

4. **Test on different networks:**
   - Switch between WiFi and mobile data
   - Try a different WiFi network

## Error Messages Explained

| Error Message | Meaning | Solution |
|--------------|---------|----------|
| "Request timeout" | Proxy took too long to respond | Try again or use different network |
| "HTTP 403" | Website/proxy blocked the request | Try different website |
| "HTTP 429" | Rate limit exceeded | Wait a few minutes |
| "Received empty or invalid response" | Proxy returned no content | Try different proxy (automatic) |
| "Could not extract meaningful content" | Website structure not parseable | Website may require JavaScript |

## Mobile-Specific Improvements

The app now includes these mobile optimizations:

1. **Longer timeout**: 30 seconds on mobile vs 20 seconds on desktop
2. **Better error handling**: Graceful fallbacks for limited browser APIs
3. **Removed User-Agent header**: Prevents mobile browser conflicts
4. **AbortController support**: Proper timeout handling
5. **DOMParser fallback**: Works even if parsing fails

## Still Having Issues?

If website fetching still doesn't work on mobile:

1. **Alternative approach**: Manually copy/paste content
   - Open the website in your mobile browser
   - Select and copy the text content
   - Paste into the context input field

2. **Use desktop**: If possible, use the desktop version
   - The online demo works better on desktop browsers
   - Desktop has fewer CORS/security restrictions

3. **Report the issue**: 
   - Note your device (iPhone 14, Samsung Galaxy S21, etc.)
   - Note your browser (Safari 16, Chrome 120, etc.)
   - Note the specific website URL that failed
   - Include any error messages from console

## Technical Details

### How Website Fetching Works

1. User enters URL
2. App validates URL (security check)
3. App tries CORS proxies in order:
   - api.allorigins.win
   - corsproxy.io
   - api.codetabs.com
4. Proxy fetches the website
5. App extracts main content
6. App converts HTML to Markdown
7. Content is added to context

### Why CORS Proxies Are Needed

Browsers block direct cross-origin requests for security. CORS proxies act as intermediaries that:
- Fetch the website server-side
- Add proper CORS headers
- Return content to your browser

### Mobile Browser Differences

| Feature | Desktop | iOS Safari | Android Chrome |
|---------|---------|------------|----------------|
| Fetch API | Full | Full | Full |
| AbortController | Yes | iOS 12.2+ | Chrome 66+ |
| DOMParser | Yes | Yes | Yes |
| CORS | Standard | Stricter | Standard |
| Timeout | 20s | 30s | 30s |
