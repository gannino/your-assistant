#!/usr/bin/env node

/**
 * Configure notarization dynamically based on environment variables
 * 
 * This script modifies package.json before electron-builder runs to:
 * - Enable notarization if APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, and APPLE_TEAM_ID are set
 * - Keep notarization disabled for local builds without credentials
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

const hasNotarizationSecrets =
  process.env.APPLE_ID &&
  process.env.APPLE_APP_SPECIFIC_PASSWORD &&
  process.env.APPLE_TEAM_ID;

const hasSigningCertificate = process.env.CSC_LINK || process.env.CSC_NAME;

if (hasSigningCertificate) {
  console.log('[notarize-config] ✅ Signing certificate detected');
  packageJson.build.mac.hardenedRuntime = true;

  if (hasNotarizationSecrets) {
    console.log('[notarize-config] ✅ Notarization secrets detected, enabling notarization');
    packageJson.build.mac.notarize = {
      teamId: process.env.APPLE_TEAM_ID,
    };
  } else {
    console.log('[notarize-config] ⚠️  No notarization secrets, skipping notarization');
    packageJson.build.mac.notarize = false;
  }
} else {
  console.log('[notarize-config] ⚠️  No signing certificate detected');
  console.log('[notarize-config] Using adhoc signing with entitlements (hardenedRuntime=false)');
  packageJson.build.mac.hardenedRuntime = false;
  packageJson.build.mac.notarize = false;
}

// Write back to package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('[notarize-config] package.json updated');
