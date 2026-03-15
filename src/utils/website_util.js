import TurndownService from 'turndown';
import DOMPurify from 'dompurify';

// Initialize turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

// Keep bold, italic, and links
turndownService.keep(['strong', 'em', 'a']);

/**
 * Fetch website content and convert to markdown
 * @param {string} url - Website URL
 * @returns {Promise<string>} Markdown content
 */
export async function fetchWebsiteToMarkdown(url) {
  // Validate URL
  if (!url || !isValidUrl(url)) {
    throw new Error('Please enter a valid URL (e.g., https://example.com)');
  }

  // Validate against SSRF attacks
  if (!isSafeUrl(url)) {
    throw new Error('Access to internal/private network resources is not allowed');
  }

  // Detect mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Mobile pre-flight check
  if (isMobile) {
    console.log('[Website Fetch] Mobile device detected');

    // Check if page is visible (some browsers throttle background tabs)
    if (document.hidden) {
      console.warn('[Website Fetch] Page is hidden - requests may be throttled');
    }

    // Check for low-power mode (if available)
    if ('connection' in navigator && navigator.connection.saveData) {
      console.warn('[Website Fetch] Low-power mode detected - may affect performance');
    }
  }

  // Check mobile network quality if available
  let networkQuality = 'unknown';
  if (isMobile && navigator.connection) {
    networkQuality = navigator.connection.effectiveType || 'unknown';
    console.log('[Website Fetch] Mobile network quality: ' + networkQuality);

    // Adjust timeout based on network quality
    if (networkQuality === 'slow-2g' || networkQuality === '2g') {
      console.warn('[Website Fetch] Slow mobile network detected - will use extended timeout');
    }
  }

  // Mobile-specific proxy order (try different proxies first for mobile)
  const mobileCorsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];

  // Desktop proxy order
  const desktopCorsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://api.codetabs.com/v1/proxy?quest=',
  ];

  const corsProxies = isMobile ? mobileCorsProxies : desktopCorsProxies;

  let lastError = null;
  let attemptCount = 0;
  const maxAttempts = corsProxies.length;

  // Try each CORS proxy
  for (const proxy of corsProxies) {
    attemptCount++;
    try {
      console.log(
        '[Website Fetch] (' + attemptCount + '/' + maxAttempts + ') Trying proxy: ' + proxy
      );
      console.log('[Website Fetch] Target URL: ' + url);
      console.log('[Website Fetch] Device: ' + (isMobile ? 'Mobile' : 'Desktop'));

      const proxiedUrl = proxy + encodeURIComponent(url);

      // Dynamic timeout based on device and network quality
      let timeoutMs = isMobile ? 30000 : 20000;

      // Extend timeout for slow mobile networks
      if (isMobile && networkQuality !== 'unknown') {
        if (networkQuality === 'slow-2g' || networkQuality === '2g') {
          timeoutMs = 45000; // 45 seconds for very slow networks
        } else if (networkQuality === '3g') {
          timeoutMs = 35000; // 35 seconds for 3g
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      console.log(
        '[Website Fetch] Timeout set to: ' +
          timeoutMs +
          'ms' +
          (isMobile ? ' (mobile-adjusted)' : '')
      );
      console.log('[Website Fetch] Network quality: ' + networkQuality);
      const fetchStartTime = Date.now();

      // Don't set User-Agent header on mobile - let browser use its natural UA
      // This allows mobile browsers to identify themselves correctly to servers
      const headers = {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      };

      // Only add custom User-Agent on desktop (mobile browsers are more sensitive to custom headers)
      if (!isMobile) {
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      }

      const response = await fetch(proxiedUrl, {
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);
      const fetchTime = Date.now() - fetchStartTime;
      console.log('[Website Fetch] Response received in ' + fetchTime + 'ms');
      console.log('[Website Fetch] Status: ' + response.status + ' ' + response.statusText);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }

      const html = await response.text();
      console.log('[Website Fetch] Content length: ' + html.length + ' characters');

      // Check if we got actual content (not an error page)
      if (!html || html.length < 100) {
        throw new Error('Received empty or invalid response');
      }

      // Mobile-specific check for common mobile blocking pages
      if (isMobile) {
        // Check if response contains indicators of mobile blocking
        const mobileBlockIndicators = [
          'access denied',
          'mobile access not supported',
          'please use desktop',
          'mobile version coming soon',
          'download our app',
        ];
        const lowerHtml = html.toLowerCase();
        const isBlocked = mobileBlockIndicators.some(indicator => lowerHtml.includes(indicator));

        if (isBlocked) {
          throw new Error(
            'Website blocks mobile access. Try using a desktop browser or a different website.'
          );
        }
      }

      // Extract main content (remove nav, footer, scripts, etc.)
      const cleanedHtml = extractMainContent(html);

      // Convert to markdown
      const markdown = turndownService.turndown(cleanedHtml);

      // Clean up markdown
      const cleanedMarkdown = cleanMarkdown(markdown);

      // Check if we got meaningful content
      if (cleanedMarkdown.length < 50) {
        throw new Error('Could not extract meaningful content from the website');
      }

      console.log('Successfully fetched ' + cleanedMarkdown.length + ' characters of markdown');
      return cleanedMarkdown;
    } catch (error) {
      const errorMsg = error.name === 'AbortError' ? 'Request timeout' : error.message;
      console.error('[Website Fetch] Proxy ' + proxy + ' failed');
      console.error('[Website Fetch] Error type: ' + error.name);
      console.error('[Website Fetch] Error message: ' + errorMsg);

      // Mobile-specific error logging
      if (isMobile) {
        console.error('[Website Fetch] Mobile-specific issue detected');
        console.error(
          '[Website Fetch] Network type: ' + (navigator.connection?.effectiveType || 'unknown')
        );

        // Check for common mobile network issues
        if (errorMsg.includes('Failed to fetch') || errorMsg.includes('Network error')) {
          console.warn(
            '[Website Fetch] Possible mobile network issue - will retry with next proxy'
          );
        }
      }

      console.error('[Website Fetch] Full error:', error);
      lastError = error;
      // Continue to next proxy
    }
  }

  // All proxies failed
  const errorMsg = lastError && lastError.message ? lastError.message : 'Unknown error';
  console.error('[Website Fetch] All proxies failed');
  console.error('[Website Fetch] Last error: ' + errorMsg);
  console.error('[Website Fetch] Device: ' + (isMobile ? 'Mobile' : 'Desktop'));
  console.error('[Website Fetch] User Agent: ' + navigator.userAgent);

  // Provide mobile-specific troubleshooting
  let errorDetails =
    'The website may be blocking automated access or may require JavaScript to load content.';
  if (isMobile) {
    errorDetails += '\n\nMobile troubleshooting:\n';
    errorDetails += '• Try switching between WiFi and mobile data\n';
    errorDetails += '• Ensure you have a stable internet connection\n';
    errorDetails += '• Some websites may block mobile browsers - try a different website\n';
    errorDetails += '• iOS Safari users: Try Chrome or Firefox instead\n';
    errorDetails += '• If the issue persists, try copying the content manually';
  }

  throw new Error(
    'Failed to fetch website after trying multiple CORS proxies. Last error: ' +
      errorMsg +
      '. ' +
      errorDetails
  );
}

/**
 * Extract main content from HTML
 * @param {string} html - Raw HTML
 * @returns {string} Cleaned HTML
 */
function extractMainContent(html) {
  // Check if DOMParser is available
  if (typeof DOMParser === 'undefined') {
    console.warn('DOMParser not available, returning raw HTML');
    return html;
  }

  try {
    // Create a temporary DOM element
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check if parsing was successful
    if (!doc || !doc.body) {
      console.warn('Failed to parse HTML, returning raw HTML');
      return html;
    }

    // Remove unwanted elements
    const elementsToRemove = [
      'nav',
      'header',
      'footer',
      'script',
      'style',
      'noscript',
      'iframe',
      'svg',
      'video',
      'audio',
    ];

    elementsToRemove.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Remove by class names (common navigation/footer elements)
    const classesToRemove = [
      'navigation',
      'navbar',
      'menu',
      'nav-menu',
      'footer',
      'copyright',
      'social-icons',
      'cookie-banner',
      'popup',
      'modal',
      'sidebar',
      'widget',
      'advertisement',
    ];

    classesToRemove.forEach(className => {
      const elements = doc.querySelectorAll('.' + className);
      elements.forEach(el => el.remove());
    });

    // Try to find main content
    const mainContent =
      doc.querySelector('main') ||
      doc.querySelector('article') ||
      doc.querySelector('[role="main"]') ||
      doc.querySelector('.content') ||
      doc.querySelector('#content') ||
      doc.querySelector('.main-content') ||
      doc.querySelector('#main') ||
      doc.body;

    // Sanitize HTML content to prevent XSS attacks
    const unsafeHtml = mainContent ? mainContent.innerHTML : doc.body.innerHTML;
    const cleanConfig = {
      // Allow safe HTML tags for content formatting
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'em',
        'a',
        'ul',
        'ol',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'code',
        'pre',
      ],
      // Allow safe attributes
      ALLOWED_ATTR: ['href', 'title'],
      // Forbid all protocols except https, http, mailto
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
    };
    return DOMPurify.sanitize(unsafeHtml, cleanConfig);
  } catch (error) {
    console.warn('Error extracting main content:', error.message);
    return html;
  }
}

/**
 * Clean up markdown
 * @param {string} markdown - Raw markdown
 * @returns {string} Cleaned markdown
 */
function cleanMarkdown(markdown) {
  return (
    markdown
      // Remove excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      // Remove navigation links
      .replace(/^\s*Skip to content\s*$/gim, '')
      // Remove empty links
      .replace(/\[\]\([^)]*\)/g, '')
      // Remove images (optional - comment out if you want to keep image references)
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .trim()
  );
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate URL is safe from SSRF attacks
 * @param {string} url - URL to validate
 * @returns {boolean} True if safe
 */
function isSafeUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Block localhost, loopback, and unspecified addresses
    if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '::1') {
      return false;
    }

    // Block IPv4-mapped IPv6 loopback and private IPv6 ranges
    if (
      hostname.startsWith('[::ffff:') ||
      hostname.startsWith('::ffff:') ||
      hostname.startsWith('[fc') ||
      hostname.startsWith('[fd')
    ) {
      return false;
    }

    // Block non-decimal IP encodings (octal, hex, decimal integer)
    // e.g. 0x7f000001, 2130706433, 0177.0.0.1 — normalize via URL and re-check
    if (/^(0x[0-9a-f]+|0[0-7]+|\d{8,10})$/i.test(hostname)) {
      return false;
    }

    // Block private IP ranges (IPv4)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const [, a, b] = match.map(Number);
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 127.0.0.0/8, 0.0.0.0/8
      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 169 && b === 254)
      ) {
        return false;
      }
    }

    // Block link-local addresses
    if (hostname.startsWith('169.254.') || hostname.startsWith('fe80:')) {
      return false;
    }

    // Note: DNS rebinding (domain resolves to private IP after validation) cannot
    // be fully prevented client-side. This validation reduces the attack surface
    // but the CORS proxy is the ultimate enforcement point.
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate URL for website fetching
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export function validateWebsiteUrl(url) {
  if (!url) {
    return { valid: false, error: 'Please enter a URL' };
  }

  if (!isValidUrl(url)) {
    return { valid: false, error: 'Please enter a valid URL (e.g., https://example.com)' };
  }

  if (!isSafeUrl(url)) {
    return { valid: false, error: 'Access to internal/private network resources is not allowed' };
  }

  return { valid: true };
}

/**
 * Get domain from URL for display
 * @param {string} url - URL
 * @returns {string} Domain name
 */
export function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}
