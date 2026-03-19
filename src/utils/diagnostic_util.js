/**
 * Diagnostic utility for troubleshooting website fetching on mobile
 * Add this to browser console to get detailed debugging information
 */

const PRIVATE_IP_PATTERN =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|0\.0\.0\.0)/i;

/**
 * Validate that a URL is safe to fetch (public http/https only).
 * @param {string} url
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: `Disallowed protocol: ${parsed.protocol}` };
  }
  if (PRIVATE_IP_PATTERN.test(parsed.hostname)) {
    return { valid: false, reason: `Private/loopback host not allowed: ${parsed.hostname}` };
  }
  return { valid: true };
}

export async function diagnoseWebsiteFetching(url) {
  console.log('=== Website Fetching Diagnostics ===');
  console.log('URL:', url);
  console.log('User Agent:', navigator.userAgent);
  console.log('Platform:', navigator.platform);
  console.log('Online:', navigator.onLine);

  // Check browser capabilities
  console.log('\n=== Browser Capabilities ===');
  console.log('Fetch API:', typeof fetch !== 'undefined');
  console.log('AbortController:', typeof AbortController !== 'undefined');
  console.log('DOMParser:', typeof DOMParser !== 'undefined');
  console.log('Promise:', typeof Promise !== 'undefined');

  const { valid, reason } = validateUrl(url);
  if (!valid) {
    console.error('[Diagnostic] URL validation failed:', reason);
    return;
  }

  // Test CORS proxies individually
  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];

  console.log('\n=== Testing CORS Proxies ===');

  for (const proxy of corsProxies) {
    try {
      console.log('\nTesting:', proxy);
      const startTime = Date.now();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(proxy + encodeURIComponent(url), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      console.log('✓ Status:', response.status, response.statusText);
      console.log('✓ Time:', elapsed + 'ms');
      console.log('✓ Content-Type:', response.headers.get('content-type'));

      const text = await response.text();
      console.log('✓ Content length:', text.length, 'characters');
      console.log('✓ First 200 chars:', text.substring(0, 200));
    } catch (error) {
      console.error('✗ Failed:', error.name, '-', error.message);
      if (error.name === 'AbortError') {
        console.error('  Reason: Request timeout (>10s)');
      } else if (error.name === 'TypeError') {
        console.error('  Reason: Network error or CORS issue');
      }
    }
  }

  console.log('\n=== Diagnostics Complete ===');
}

// Quick test function
export async function quickTest() {
  console.log('Running quick test with example.com...');
  await diagnoseWebsiteFetching('https://example.com');
}

// Export for use in console
if (typeof window !== 'undefined') {
  window.diagnoseWebsiteFetching = diagnoseWebsiteFetching;
  window.quickTest = quickTest;
  console.log('Diagnostic tools loaded!');
  console.log('Usage: diagnoseWebsiteFetching("https://example.com")');
  console.log('Quick test: quickTest()');
}
