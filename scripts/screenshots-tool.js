const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// ============================================================
//                    CONFIGURATION
// ============================================================

// Base URL to navigate to (override with --url)
const URL = 'https://localhost:8080';

// Output directory for screenshots (override with --output-dir)
const OUTPUT_DIR = 'docs/imgs';

// Viewport size or preset name (override with --viewport)
// Presets: 'desktop', 'laptop', 'tablet', 'mobile', 'mobile-xl'
// Or custom: { width: 1920, height: 1080 }
const VIEWPORT = { width: 1920, height: 1080 };

// Headless mode (override with --headless)
const HEADLESS = false;

// Wait time after page load in ms (override with --initial-wait)
const INITIAL_WAIT = 3000;

// Default timeout for actions in ms (override with --timeout)
const DEFAULT_TIMEOUT = 10000;

// ============================================================
//                    ACTIONS MAP
// ============================================================

// Define your screenshot workflow here
// Each action can: click a button, wait, and/or take a screenshot
const ACTIONS = [
  // Action 1: Initial page load screenshot
  {
    name: 'main-interface',
    screenshot: 'main-interface.png',
    fullPage: true,
    waitFor: 3000
  },

  // Action 2: Navigate to Settings and screenshot
  {
    name: 'navigate-settings',
    click: {
      type: 'text',      // 'text', 'css', or 'xpath'
      value: 'Settings',
      timeout: 10000
    },
    waitFor: 2000
  },
  {
    name: 'settings-page',
    screenshot: 'settings-page.png',
    fullPage: true
  },

  // Action 3: Navigate to Speech Settings
  {
    name: 'navigate-speech',
    click: { type: 'text', value: 'Speech' },
    waitFor: 2000
  },
  {
    name: 'speech-settings',
    screenshot: 'speech-settings.png',
    fullPage: true
  },

  // Action 4: Navigate to Content Settings
  {
    name: 'navigate-back-from-speech',
    click: { type: 'text', value: 'Settings' },
    waitFor: 1000
  },
  {
    name: 'navigate-content',
    click: { type: 'text', value: 'Content' },
    waitFor: 2000
  },
  {
    name: 'content-settings',
    screenshot: 'content-settings.png',
    fullPage: true
  },

  // Action 5: Navigate to AI Settings
  {
    name: 'navigate-back-from-content',
    click: { type: 'text', value: 'Settings' },
    waitFor: 1000
  },
  {
    name: 'navigate-ai',
    click: { type: 'text', value: 'AI' },
    waitFor: 2000
  },
  {
    name: 'ai-settings',
    screenshot: 'ai-settings.png',
    fullPage: true
  },

  // Action 6: Navigate to Overlay Settings
  {
    name: 'navigate-back-from-ai',
    click: { type: 'text', value: 'Settings' },
    waitFor: 1000
  },
  {
    name: 'navigate-overlay',
    click: { type: 'text', value: 'Overlay' },
    waitFor: 2000
  },
  {
    name: 'electron-settings',
    screenshot: 'electron-settings.png',
    fullPage: true
  }
];

// ============================================================
//                    VIEWPORT PRESETS
// ============================================================

const VIEWPORT_PRESETS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  'mobile-xl': { width: 414, height: 896 }
};

// ============================================================
//                    CLI CONFIG
// ============================================================

/**
 * Parse CLI arguments to override config values
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--url':
        config.url = args[++i];
        break;
      case '--output-dir':
        config.outputDir = args[++i];
        break;
      case '--viewport':
        config.viewport = args[++i];
        break;
      case '--headless':
        config.headless = true;
        break;
      case '--initial-wait':
        config.initialWait = parseInt(args[++i]);
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]);
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        console.warn(`⚠️  Unknown argument: ${args[i]}`);
        console.warn('Run --help for available options');
    }
  }

  return config;
}

/**
 * Print help message with current defaults
 */
function printHelp() {
  console.log(`
Playwright Screenshot Tool
=========================

Usage: node screenshots-tool.js [options]

Options:
  --url <url>              Override URL (default: ${URL})
  --output-dir <dir>       Override output directory (default: ${OUTPUT_DIR})
  --viewport <preset>      Override viewport (default: custom or 'desktop')
                           Presets: desktop, laptop, tablet, mobile, mobile-xl
  --headless               Run in headless mode (default: ${HEADLESS})
  --initial-wait <ms>      Override initial wait time (default: ${INITIAL_WAIT})
  --timeout <ms>           Override action timeout (default: ${DEFAULT_TIMEOUT})
  --help                   Show this help message

Examples:
  node screenshots-tool.js
  node screenshots-tool.js --url https://example.com
  node screenshots-tool.js --viewport mobile --headless
  node screenshots-tool.js --output-dir test-shots --url http://localhost:3000
`);
}

/**
 * Resolve viewport from preset name or custom object
 */
function resolveViewport(viewport) {
  if (typeof viewport === 'string') {
    const preset = VIEWPORT_PRESETS[viewport];
    if (preset) {
      return preset;
    }
    console.error(`❌ Unknown viewport preset: ${viewport}`);
    console.error('Available presets:', Object.keys(VIEWPORT_PRESETS).join(', '));
    process.exit(1);
  }
  return viewport;
}

// ============================================================
//                    IMPLEMENTATION
// ============================================================

/**
 * Execute a single action
 */
async function executeAction(page, action, config, outputDir) {
  try {
    console.log(`\n[${config.currentIndex}/${config.totalActions}] ${action.name}`);

    // Handle click action
    if (action.click) {
      const selector = buildSelector(action.click);
      console.log(`   🖱️  Clicking: ${action.click.type}="${action.click.value}"`);

      await page.click(selector, { timeout: action.click.timeout || config.timeout });
      console.log(`   ✅ Clicked successfully`);
    }

    // Handle back action
    if (action.back) {
      console.log(`   ⬅️  Going back`);
      await page.goBack();
      console.log(`   ✅ Navigated back`);
    }

    // Handle wait action
    if (action.waitFor) {
      if (typeof action.waitFor === 'number') {
        console.log(`   ⏳ Waiting ${action.waitFor}ms`);
        await page.waitForTimeout(action.waitFor);
      } else if (typeof action.waitFor === 'string') {
        console.log(`   ⏳ Waiting for selector: ${action.waitFor}`);
        await page.waitForSelector(action.waitFor, { timeout: config.timeout });
      }
    }

    // Handle screenshot action
    if (action.screenshot) {
      const screenshotPath = path.join(outputDir, action.screenshot);
      console.log(`   📸 Screenshot: ${action.screenshot}`);

      await page.screenshot({
        path: screenshotPath,
        fullPage: action.fullPage || false
      });

      console.log(`   ✅ Screenshot saved`);
    }

    return { success: true };
  } catch (error) {
    console.warn(`   ⚠️  Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Build Playwright selector from action config
 */
function buildSelector(clickConfig) {
  switch (clickConfig.type) {
    case 'text':
      return `text=${clickConfig.value}`;
    case 'css':
      return clickConfig.value;
    case 'xpath':
      return `xpath=${clickConfig.value}`;
    default:
      throw new Error(`Unknown selector type: ${clickConfig.type}`);
  }
}

/**
 * Main screenshot function
 */
async function takeScreenshots() {
  // Parse CLI arguments and merge with defaults
  const cliConfig = parseArgs();
  const finalConfig = {
    url: cliConfig.url || URL,
    outputDir: cliConfig.outputDir || OUTPUT_DIR,
    viewport: resolveViewport(cliConfig.viewport || VIEWPORT),
    headless: cliConfig.headless !== undefined ? cliConfig.headless : HEADLESS,
    initialWait: cliConfig.initialWait || INITIAL_WAIT,
    timeout: cliConfig.timeout || DEFAULT_TIMEOUT
  };

  // Display configuration
  console.log('✅ Configuration loaded');
  console.log(`   URL: ${finalConfig.url}`);
  console.log(`   Output: ${finalConfig.outputDir}`);
  console.log(`   Viewport: ${finalConfig.viewport.width}x${finalConfig.viewport.height}`);
  console.log(`   Headless: ${finalConfig.headless}`);
  console.log(`   Actions: ${ACTIONS.length}`);

  // Create output directory if it doesn't exist
  const absoluteOutputDir = path.resolve(finalConfig.outputDir);
  if (!fs.existsSync(absoluteOutputDir)) {
    fs.mkdirSync(absoluteOutputDir, { recursive: true });
    console.log(`\n📁 Created output directory: ${absoluteOutputDir}`);
  }

  let browser;
  let screenshotCount = 0;
  let failureCount = 0;

  try {
    // Launch browser
    console.log('\n✅ Launching browser');
    browser = await chromium.launch({
      headless: finalConfig.headless
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      viewport: finalConfig.viewport
    });

    const page = await context.newPage();

    // Navigate to URL
    console.log(`✅ Navigating to ${finalConfig.url}`);
    await page.goto(finalConfig.url, { waitUntil: 'networkidle' });

    // Wait for initial page load
    console.log(`✅ Waiting ${finalConfig.initialWait}ms for page load`);
    await page.waitForTimeout(finalConfig.initialWait);

    // Execute actions
    console.log(`\n🚀 Executing ${ACTIONS.length} actions...\n`);

    for (let i = 0; i < ACTIONS.length; i++) {
      const action = ACTIONS[i];
      const result = await executeAction(page, action, {
        ...finalConfig,
        currentIndex: i + 1,
        totalActions: ACTIONS.length
      }, absoluteOutputDir);

      if (result.success) {
        if (action.screenshot) {
          screenshotCount++;
        }
      } else {
        failureCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All actions completed!');
    console.log(`📁 Output directory: ${absoluteOutputDir}`);
    console.log(`📊 Screenshots captured: ${screenshotCount}`);
    if (failureCount > 0) {
      console.log(`⚠️  Failed actions: ${failureCount}`);
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n👋 Browser closed');
    }
  }
}

// Run the script
takeScreenshots().catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
