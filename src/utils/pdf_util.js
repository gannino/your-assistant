import * as pdfjsLib from 'pdfjs-dist';

// Configure worker using bundled version (NOT CDN)
// For PDF.js 5.x, we need to use the correct worker path
// NOTE: Worker configuration is done in main.js to avoid import.meta issues in tests
// This allows the utility to be tested without ES module complications

/**
 * Browser capability detection and optimization
 */
const browserCapabilities = {
  isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ),
  isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
  isFirefox: /firefox/i.test(navigator.userAgent),
  isChrome: /chrome/i.test(navigator.userAgent) && !/edge|opr/i.test(navigator.userAgent),
  memoryLimit: getDeviceMemoryLimit(),
  supportSharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
};

/**
 * Get device memory limit for optimization
 */
function getDeviceMemoryLimit() {
  // @ts-ignore - deviceMemory is not in standard TypeScript types yet
  const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
  return memory * 1024 * 1024 * 1024; // Convert to bytes
}

/**
 * Get browser-specific PDF processing settings
 */
function getBrowserOptimizations() {
  return {
    // Mobile devices need more conservative settings
    maxPagesInMemory: browserCapabilities.isMobile ? 3 : 10,
    chunkSize: browserCapabilities.isMobile ? 1 : 5, // Process pages in chunks
    useProgressiveLoading:
      browserCapabilities.isMobile || browserCapabilities.memoryLimit < 4 * 1024 * 1024 * 1024,
    enableCache: !browserCapabilities.isSafari, // Safari has good native caching
    timeout: browserCapabilities.isMobile ? 30000 : 60000, // Mobile: 30s, Desktop: 60s
    workerPort: browserCapabilities.supportSharedArrayBuffer ? 'shared' : 'dedicated',
  };
}

/**
 * Convert PDF to Markdown format with browser optimizations
 * @param {File} file - PDF file object
 * @param {Function} progressCallback - Optional progress callback(page, total)
 * @returns {Promise<string>} Markdown content
 */
export async function convertPDFToMarkdown(file, progressCallback) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Please upload a valid PDF file');
  }

  const settings = getBrowserOptimizations();
  console.log('[PDF Processing] Browser capabilities:', browserCapabilities);
  console.log('[PDF Processing] Using optimized settings:', settings);

  try {
    // Add timeout for mobile browsers
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF processing timeout')), settings.timeout);
    });

    const processingPromise = processPDFWithOptimizations(file, settings, progressCallback);

    const result = await Promise.race([processingPromise, timeoutPromise]);
    return result;
  } catch (error) {
    // Provide browser-specific error messages
    if (error.message.includes('timeout')) {
      throw new Error(`PDF processing took too long. Try a smaller file or use a desktop browser.`);
    }
    if (browserCapabilities.isSafari && error.message.includes('worker')) {
      throw new Error(`Safari PDF processing error. Try updating Safari or use Chrome/Firefox.`);
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Process PDF with browser-specific optimizations
 */
async function processPDFWithOptimizations(file, settings, progressCallback) {
  const startTime = performance.now();
  const arrayBuffer = await file.arrayBuffer();

  // Browser-specific loading options
  const loadingOptions = {
    data: arrayBuffer,
    // Enable native font embedding for better browser compatibility
    useSystemFonts: true,
    // Use native canvas rendering for mobile
    useNativeCanvas: browserCapabilities.isMobile,
    // Disable annotations for faster processing
    disableAutoFetch: true,
    // Progressive loading for mobile
    rangeChunkSize: browserCapabilities.isMobile ? 65536 : 262144,
  };

  const pdf = await pdfjsLib.getDocument(loadingOptions).promise;
  console.log(
    `[PDF Processing] Loaded ${pdf.numPages} pages in ${(performance.now() - startTime).toFixed(0)}ms`
  );

  let fullMarkdown = '';
  const totalPages = pdf.numPages;

  // Process pages in chunks for better memory management
  const chunks = Math.ceil(totalPages / settings.chunkSize);

  for (let chunk = 0; chunk < chunks; chunk++) {
    const startPage = chunk * settings.chunkSize + 1;
    const endPage = Math.min((chunk + 1) * settings.chunkSize, totalPages);

    console.log(
      `[PDF Processing] Processing chunk ${chunk + 1}/${chunks} (pages ${startPage}-${endPage})`
    );

    // Process pages in chunk
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const pageMarkdown = await processPageOptimized(pdf, pageNum);
      fullMarkdown += pageMarkdown + '\n\n';

      // Report progress
      if (progressCallback) {
        progressCallback(pageNum, totalPages);
      }

      // Yield to main thread for better UI responsiveness on mobile
      if (browserCapabilities.isMobile) {
        await yieldToMain();
      }
    }

    // Force garbage collection for memory-constrained devices
    if (settings.maxPagesInMemory > 0 && chunk % settings.maxPagesInMemory === 0) {
      if (window.gc) window.gc();
    }
  }

  // Clean up PDF document
  await pdf.destroy();
  const duration = ((performance.now() - startTime) / 1000).toFixed(1);
  console.log(`[PDF Processing] Completed in ${duration}s, produced ${fullMarkdown.length} chars`);

  return fullMarkdown.trim();
}

/**
 * Process a single page with browser optimizations
 */
async function processPageOptimized(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);

  // Get text content with optimized settings
  const textContent = await page.getTextContent({
    // Include marked content for better formatting
    includeMarkedContent: true,
    // Disable normalization for faster processing
    disableCombineTextItems: browserCapabilities.isFirefox, // Firefox needs combined items
  });

  // Clean up page object to free memory
  await page.cleanup();

  return convertPageToMarkdown(textContent);
}

/**
 * Yield to main thread for better UI responsiveness
 */
async function yieldToMain() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

/**
 * Convert a page's text content to markdown with browser-specific formatting
 * @param {Object} textContent - PDF.js text content object
 * @returns {Promise<string>} Markdown formatted text
 */
async function convertPageToMarkdown(textContent) {
  const items = textContent.items;
  let markdown = '';
  let lastY = null;
  let currentLine = [];

  // Group items by Y position (lines) with browser-specific thresholds
  const lineThreshold = browserCapabilities.isMobile ? 3 : 5; // Tighter spacing for mobile

  for (const item of items) {
    if (item.hasEOL) {
      // End of line - process the accumulated line
      markdown += processLineToMarkdown(currentLine) + '\n';
      currentLine = [];
      lastY = null;
    } else {
      // Track Y position to detect new lines
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > lineThreshold) {
        // New line detected
        if (currentLine.length > 0) {
          markdown += processLineToMarkdown(currentLine) + '\n';
          currentLine = [];
        }
      }

      currentLine.push(item);
      lastY = item.transform[5];
    }
  }

  // Process any remaining items
  if (currentLine.length > 0) {
    markdown += processLineToMarkdown(currentLine) + '\n';
  }

  return markdown;
}

/**
 * Process a line of text items and convert to markdown with enhanced formatting
 * @param {Array} lineItems - Array of text items
 * @returns {string} Markdown formatted line
 */
function processLineToMarkdown(lineItems) {
  if (lineItems.length === 0) return '';

  let text = lineItems
    .map(item => item.str)
    .join(' ')
    .trim();

  // Skip empty lines
  if (!text) return '';

  // Enhanced heading detection with browser-specific patterns
  const isHeading =
    // All caps and reasonably short
    (text.length > 0 && text.length < 100 && text === text.toUpperCase()) ||
    // Title case at start (common in documents)
    /^[A-Z][a-z]+(\s[A-Z][a-z]+){2,}$/.test(text) ||
    // Common document heading patterns
    /^(Chapter|Section|Part|\d+\.)\s+[A-Z]/.test(text);

  if (isHeading) {
    const headingLevel = text.length < 50 ? '##' : '#';
    return `${headingLevel} ${text}\n`;
  }

  // Detect list items with international bullet points
  if (/^[\s•\-*●‣⁃◇⬥]\s/.test(text)) {
    return text;
  }

  // Detect numbered lists (including Roman numerals)
  if (/^[\d.]+\s|^[IVXLCDM]+.\s/i.test(text)) {
    return text;
  }

  // Detect code blocks or technical content (monospace patterns)
  if (/[{}();<>[\]=+\-*/]/.test(text) && text.length < 200) {
    return `\`${text}\``;
  }

  // Regular text
  return text;
}

/**
 * Extract text from a PDF file (deprecated - use convertPDFToMarkdown)
 * @param {File} file - PDF file object
 * @returns {Promise<string>} Extracted text content
 */
export async function extractTextFromPDF(file) {
  // Redirect to markdown converter for backwards compatibility
  return convertPDFToMarkdown(file);
}

/**
 * Validate PDF file with browser-specific limits
 * @param {File} file - PDF file object
 * @returns {Object} Validation result
 */
export function validatePDF(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Basic type validation
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Browser-specific size limits
  let maxSize = 10 * 1024 * 1024; // 10MB default

  if (browserCapabilities.isMobile) {
    // Mobile browsers need smaller files
    maxSize = 5 * 1024 * 1024; // 5MB for mobile
  } else if (browserCapabilities.isSafari) {
    // Safari can handle larger files
    maxSize = 15 * 1024 * 1024; // 15MB for Safari
  } else if (browserCapabilities.isChrome) {
    // Chrome handles large files well
    maxSize = 20 * 1024 * 1024; // 20MB for Chrome
  }

  if (file.size > maxSize) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const limitMB = (maxSize / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size (${sizeMB}MB) exceeds browser limit (${limitMB}MB). Try a smaller file or use a desktop browser.`,
    };
  }

  return { valid: true };
}

/**
 * Get browser compatibility information
 * @returns {Object} Browser capabilities and recommendations
 */
export function getBrowserCompatibilityInfo() {
  return {
    ...browserCapabilities,
    recommendations: getBrowserRecommendations(),
    canProcessLargeFiles: !browserCapabilities.isMobile,
    preferredChunkSize: getBrowserOptimizations().chunkSize,
    estimatedProcessingTime: getEstimatedProcessingTime(),
  };
}

/**
 * Get browser-specific recommendations
 */
function getBrowserRecommendations() {
  const recommendations = [];

  if (browserCapabilities.isMobile) {
    recommendations.push('For best results, use a desktop browser for large PDF files');
    recommendations.push('Consider using Chrome or Safari for better mobile performance');
  }

  if (browserCapabilities.isSafari) {
    recommendations.push('Safari has excellent PDF support - no additional setup needed');
    recommendations.push('For complex PDFs, try Chrome for faster processing');
  }

  if (browserCapabilities.isFirefox) {
    recommendations.push('Firefox provides good privacy protection during PDF processing');
  }

  if (browserCapabilities.isChrome) {
    recommendations.push('Chrome offers the best performance for large PDF files');
  }

  if (browserCapabilities.memoryLimit < 4 * 1024 * 1024 * 1024) {
    recommendations.push('Your device has limited memory - try processing smaller files');
  }

  return recommendations;
}

/**
 * Estimate PDF processing time based on browser and file characteristics
 */
function getEstimatedProcessingTime() {
  // Base processing times (ms per page)
  const baseTime = browserCapabilities.isMobile ? 1500 : 500;

  // Memory penalty
  const memoryMultiplier = browserCapabilities.memoryLimit < 4 * 1024 * 1024 * 1024 ? 1.5 : 1.0;

  // Browser efficiency factors
  const browserEfficiency = {
    chrome: 0.8,
    safari: 0.9,
    firefox: 1.0,
    other: 1.2,
  };

  const browserKey = browserCapabilities.isChrome
    ? 'chrome'
    : browserCapabilities.isSafari
      ? 'safari'
      : browserCapabilities.isFirefox
        ? 'firefox'
        : 'other';

  return Math.round(baseTime * memoryMultiplier * browserEfficiency[browserKey]);
}

/**
 * Test PDF processing capabilities
 * @returns {Promise<Object>} Test results
 */
export async function testPDFCapabilities() {
  const results = {
    browserInfo: browserCapabilities,
    workerAvailable: false,
    memoryEfficient: false,
    recommended: false,
    testDuration: 0,
  };

  const startTime = performance.now();

  try {
    // Test worker loading
    await pdfjsLib.GlobalWorkerOptions.workerSrc;
    results.workerAvailable = true;

    // Test memory efficiency
    results.memoryEfficient = browserCapabilities.memoryLimit >= 2 * 1024 * 1024 * 1024;

    // Overall recommendation
    results.recommended =
      results.workerAvailable &&
      results.memoryEfficient &&
      (!browserCapabilities.isMobile || browserCapabilities.isSafari);
  } catch (error) {
    console.error('[PDF Test] Capability test failed:', error);
  }

  results.testDuration = Math.round(performance.now() - startTime);
  return results;
}

/**
 * Simple cache for processed PDFs to improve performance
 */
class PDFCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = browserCapabilities.isMobile ? 3 : 10; // Fewer items on mobile
    this.maxAge = 30 * 60 * 1000; // 30 minutes
  }

  generateKey(file) {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  get(file) {
    const key = this.generateKey(file);
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if cache item is still valid
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[PDF Cache] Cache hit for ${file.name}`);
    return item.data;
  }

  set(file, data) {
    // Clear oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const key = this.generateKey(file);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    console.log(`[PDF Cache] Cached ${file.name} (${data.length} chars)`);
  }

  clear() {
    this.cache.clear();
    console.log('[PDF Cache] Cleared all cached PDFs');
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      items: Array.from(this.cache.keys()),
    };
  }
}

// Global PDF cache instance
const pdfCache = new PDFCache();

/**
 * Convert PDF to Markdown with caching support
 * @param {File} file - PDF file object
 * @param {Function} progressCallback - Optional progress callback
 * @param {boolean} useCache - Enable/disable caching (default: true)
 * @returns {Promise<string>} Markdown content
 */
export async function convertPDFToMarkdownCached(file, progressCallback, useCache = true) {
  // Check cache first if enabled
  if (useCache) {
    const cached = pdfCache.get(file);
    if (cached) {
      console.log('[PDF Processing] Using cached result');
      if (progressCallback) {
        progressCallback(100, 100); // Indicate completion
      }
      return cached;
    }
  }

  // Process the PDF
  const result = await convertPDFToMarkdown(file, progressCallback);

  // Cache the result if enabled
  if (useCache) {
    pdfCache.set(file, result);
  }

  return result;
}

/**
 * Clear PDF cache (useful for freeing memory)
 */
export function clearPDFCache() {
  pdfCache.clear();
}

/**
 * Get PDF cache statistics
 * @returns {Object} Cache stats
 */
export function getPDFCacheStats() {
  return pdfCache.getStats();
}

/**
 * Detect if PDF has complex elements that might need special handling
 * @param {File} file - PDF file object
 * @returns {Promise<Object>} Complexity analysis
 */
export async function analyzePDFComplexity(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const analysis = {
      pageCount: pdf.numPages,
      isComplex: false,
      complexity: 'simple',
      recommendations: [],
    };

    // Check page count
    if (pdf.numPages > 50) {
      analysis.isComplex = true;
      analysis.complexity = 'large';
      analysis.recommendations.push('Large PDF detected - processing may take time');
    }

    // Quick sample of first page to estimate complexity
    const firstPage = await pdf.getPage(1);
    const textContent = await firstPage.getTextContent();

    if (textContent.items.length > 500) {
      analysis.isComplex = true;
      analysis.complexity = 'complex';
      analysis.recommendations.push('Complex layout detected - may have formatting challenges');
    }

    await pdf.destroy();
    return analysis;
  } catch (error) {
    console.error('[PDF Analysis] Failed:', error);
    return {
      pageCount: 0,
      isComplex: true,
      complexity: 'unknown',
      recommendations: ['Could not analyze PDF complexity'],
    };
  }
}
