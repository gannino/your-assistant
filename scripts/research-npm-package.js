/**
 * Research NPM Package using Playwright
 *
 * Usage: node scripts/research-npm-package.js <package-name>
 * Example: node scripts/research-npm-package.js @openrouter/ai-sdk-provider
 */

const { chromium } = require('playwright');

async function researchNpmPackage(packageName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\n🔍 Researching: ${packageName}`);
    console.log('='.repeat(60));

    // Navigate to NPM package page
    const url = `https://www.npmjs.com/package/${packageName}`;
    console.log(`\n📍 URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Extract package information
    const packageInfo = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : 'N/A';
      };

      const getMultipleTextContent = (selector) => {
        return Array.from(document.querySelectorAll(selector))
          .map(el => el.textContent.trim())
          .filter(text => text);
      };

      return {
        // Package name and version
        name: getTextContent('h1'),
        version: getTextContent('[data-testid="package-version"]') ||
                getTextContent('.f28iej0'),

        // Description
        description: getTextContent('[data-testid="package-description"]') ||
                    getTextContent('.c60b6f8'),

        // Author
        author: getTextContent('[data-testid="package-author"]') ||
                getTextContent('.c1qb0r6'),

        // Keywords
        keywords: getMultipleTextContent('[data-testid="package-keyword"]') ||
                  getMultipleTextContent('a[href*="/search?q=keywords:"]'),

        // Weekly downloads
        weeklyDownloads: getTextContent('[data-testid="package-weekly-downloads"]') ||
                        getTextContent('.sc-5llu3a-0'),

        // Dependencies count
        dependencies: getTextContent('[data-testid="package-dependencies"]') ||
                     getTextContent('a[href*="/dependencies"]'),

        // License
        license: getTextContent('[data-testid="package-license"]') ||
                getTextContent('a[href*="/browse/licenses"]'),

        // Homepage
        homepage: document.querySelector('a[href*="github"]')?.href ||
                 document.querySelector('a[href*="homepage"]')?.href || 'N/A',

        // README excerpt (first 500 chars)
        readmeExcerpt: document.querySelector('[data-testid="package-readme"]')?.textContent?.substring(0, 500) ||
                      document.querySelector('.markdown')?.textContent?.substring(0, 500) ||
                      'N/A',
      };
    });

    // Display results
    console.log('\n📦 Package Information:');
    console.log('─'.repeat(60));
    console.log(`Name:           ${packageInfo.name}`);
    console.log(`Version:        ${packageInfo.version}`);
    console.log(`Description:    ${packageInfo.description}`);
    console.log(`Author:         ${packageInfo.author}`);
    console.log(`License:        ${packageInfo.license}`);
    console.log(`Homepage:       ${packageInfo.homepage}`);
    console.log(`Weekly Downloads: ${packageInfo.weeklyDownloads}`);
    console.log(`Dependencies:    ${packageInfo.dependencies}`);

    if (packageInfo.keywords && packageInfo.keywords.length > 0) {
      console.log(`\n🏷️  Keywords:`);
      packageInfo.keywords.forEach(kw => console.log(`   - ${kw}`));
    }

    if (packageInfo.readmeExcerpt && packageInfo.readmeExcerpt !== 'N/A') {
      console.log(`\n📝 README Preview:`);
      console.log('─'.repeat(60));
      console.log(packageInfo.readmeExcerpt.substring(0, 300) + '...');
    }

    // Take screenshot
    const screenshotPath = `docs/imgs/${packageName.replace('@', '').replace('/', '-')}-research.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n📸 Screenshot saved: ${screenshotPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Research complete!\n');

  } catch (error) {
    console.error(`\n❌ Error researching package: ${error.message}`);
    throw error;
  } finally {
    await browser.close();
  }
}

// Get package name from command line
const packageName = process.argv[2];

if (!packageName) {
  console.error('Usage: node scripts/research-npm-package.js <package-name>');
  console.error('Example: node scripts/research-npm-package.js @openrouter/ai-sdk-provider');
  process.exit(1);
}

researchNpmPackage(packageName).catch(error => {
  console.error('Research failed:', error);
  process.exit(1);
});
