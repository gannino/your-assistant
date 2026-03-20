#!/usr/bin/env node

/**
 * afterSign hook for electron-builder
 * 
 * This script runs after electron-builder signs the app.
 * It ensures entitlements are properly applied for both:
 * - Signed builds (with Developer ID certificate)
 * - Adhoc builds (local development, no certificate)
 * 
 * Without this, adhoc builds ignore entitlements entirely, causing
 * macOS to silently deny microphone/camera/screen recording permissions.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
  // Only run on macOS builds
  if (context.electronPlatformName !== 'darwin') {
    console.log('[afterSign] Skipping: not a macOS build');
    return;
  }

  const appPath = context.appOutDir + '/' + context.packager.appInfo.productFilename + '.app';
  const entitlementsPath = path.join(__dirname, '../electron/entitlements.mac.plist');

  console.log('[afterSign] App path:', appPath);
  console.log('[afterSign] Entitlements path:', entitlementsPath);

  // Check if app exists
  if (!fs.existsSync(appPath)) {
    console.error('[afterSign] ERROR: App not found at', appPath);
    return;
  }

  // Check if entitlements file exists
  if (!fs.existsSync(entitlementsPath)) {
    console.error('[afterSign] ERROR: Entitlements file not found at', entitlementsPath);
    return;
  }

  try {
    // Check current signature
    console.log('[afterSign] Checking current signature...');
    const signInfo = execSync(`codesign -dv "${appPath}" 2>&1`, { encoding: 'utf8' });
    console.log('[afterSign] Current signature:', signInfo);

    const isAdhoc = signInfo.includes('Signature=adhoc');
    const hasCertificate = process.env.CSC_LINK || process.env.CSC_NAME;

    if (isAdhoc && !hasCertificate) {
      console.log('[afterSign] Adhoc signature detected, no certificate provided');
      console.log('[afterSign] Re-signing with entitlements for local development...');

      // Re-sign with entitlements using adhoc signature
      execSync(
        `codesign --force --deep --sign - --entitlements "${entitlementsPath}" "${appPath}"`,
        { stdio: 'inherit' }
      );

      console.log('[afterSign] ✅ Adhoc signature applied with entitlements');
    } else if (hasCertificate) {
      console.log('[afterSign] Certificate detected, electron-builder handled signing');
      console.log('[afterSign] ✅ Entitlements should be embedded by electron-builder');
    } else {
      console.log('[afterSign] ⚠️  Unknown signing state');
    }

    // Verify entitlements are embedded
    console.log('[afterSign] Verifying entitlements...');
    const entitlementsCheck = execSync(
      `codesign -d --entitlements - "${appPath}" 2>&1 | grep -A 20 "<?xml"`,
      { encoding: 'utf8' }
    );

    if (entitlementsCheck.includes('com.apple.security.device.audio-input')) {
      console.log('[afterSign] ✅ Microphone entitlement verified');
    } else {
      console.warn('[afterSign] ⚠️  Microphone entitlement NOT found');
    }

    if (entitlementsCheck.includes('com.apple.security.screen-capture')) {
      console.log('[afterSign] ✅ Screen capture entitlement verified');
    } else {
      console.warn('[afterSign] ⚠️  Screen capture entitlement NOT found');
    }
  } catch (error) {
    console.error('[afterSign] ERROR:', error.message);
    // Don't fail the build, just warn
    console.warn('[afterSign] ⚠️  Continuing despite signing errors');
  }
};
