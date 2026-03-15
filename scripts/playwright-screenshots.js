const { chromium } = require('playwright');

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }  // Full HD resolution
  });
  const page = await context.newPage();

  try {
    // Navigate to your app (adjust URL as needed)
    await page.goto('https://localhost:8080', { waitUntil: 'networkidle' });
    
    // Wait for the app to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of main interface
    await page.screenshot({ 
      path: 'docs/imgs/main-interface.png',
      fullPage: true 
    });
    
    console.log('✅ Main interface screenshot saved');
    
    // Navigate to Settings page
    try {
      // First try clicking the Settings menu item directly
      await page.click('text=Settings', { timeout: 10000 });
      await page.waitForTimeout(2000);
      
      // Take screenshot of Settings page
      await page.screenshot({ 
        path: 'docs/imgs/settings-page.png',
        fullPage: true 
      });
      
      console.log('✅ Settings page screenshot saved');
      
      // Navigate to Speech Settings
      try {
        await page.click('text=Speech', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Take screenshot of Speech Settings page
        await page.screenshot({ 
          path: 'docs/imgs/speech-settings.png',
          fullPage: true 
        });
        
        console.log('✅ Speech Settings screenshot saved');
      } catch (speechError) {
        console.log('⚠️ Could not navigate to Speech Settings, continuing...');
      }
      
      // Navigate to Content Settings
      try {
        await page.click('text=Content', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Take screenshot of Content Settings
        await page.screenshot({ 
          path: 'docs/imgs/content-settings.png',
          fullPage: true 
        });
        
        console.log('✅ Content Settings screenshot saved');
      } catch (contentError) {
        console.log('⚠️ Could not navigate to Content Settings, continuing...');
      }
      
      // Navigate to AI Settings
      try {
        await page.click('text=AI', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Take screenshot of AI Settings
        await page.screenshot({ 
          path: 'docs/imgs/ai-settings.png',
          fullPage: true 
        });
        
        console.log('✅ AI Settings screenshot saved');
      } catch (aiError) {
        console.log('⚠️ Could not navigate to AI Settings, continuing...');
      }
      
      // Navigate to Electron Settings
      try {
        await page.click('text=Overlay', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Take screenshot of Electron Settings
        await page.screenshot({ 
          path: 'docs/imgs/electron-settings.png',
          fullPage: true 
        });
        
        console.log('✅ Electron Settings screenshot saved');
      } catch (electronError) {
        console.log('⚠️ Could not navigate to Electron Settings, continuing...');
      }
      
    } catch (settingsError) {
      console.log('⚠️ Could not navigate to Settings page, continuing...');
    }

  } catch (error) {
    console.error('❌ Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();