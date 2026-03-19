#!/usr/bin/env node

/**
 * Manual Release Script
 *
 * This script creates a manual release that is fully compatible with Release Please.
 * It updates both package.json and the Release Please manifest file, ensuring
 * that manual releases and automated releases can coexist seamlessly.
 *
 * Usage:
 *   node scripts/release-manual.js patch
 *   node scripts/release-manual.js minor
 *   node scripts/release-manual.js major
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MANIFEST_FILE = path.join(__dirname, '..', '.github', 'release-please-manifest.json');

function getCurrentVersion() {
  const packageJson = require('../package.json');
  return packageJson.version;
}

function updateManifest(version) {
  let manifest = {};

  // Read existing manifest if it exists
  if (fs.existsSync(MANIFEST_FILE)) {
    try {
      const content = fs.readFileSync(MANIFEST_FILE, 'utf8');
      manifest = JSON.parse(content);
    } catch (error) {
      console.log('Creating new manifest file');
    }
  }

  // Update manifest with new version
  manifest[''] = version;

  // Write updated manifest
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✅ Updated manifest to version ${version}`);
}

function runNpmVersion(versionType) {
  console.log(`Running: npm version ${versionType}`);

  try {
    const output = execSync(`npm version ${versionType}`, {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    return output;
  } catch (error) {
    console.error('❌ npm version failed:', error.message);
    throw error;
  }
}

function gitCommit(version) {
  const message = `chore: release ${version}

Manual release using Release Please-compatible format.
Updates manifest and package.json for version ${version}.`;

  try {
    // Stage changes
    execSync('git add package.json .github/release-please-manifest.json', {
      stdio: 'inherit'
    });

    // Commit changes
    execSync(`git commit -m "${message}"`, {
      stdio: 'inherit'
    });

    console.log(`✅ Created release commit for version ${version}`);
  } catch (error) {
    console.error('❌ git commit failed:', error.message);
    throw error;
  }
}

function createAndPushTag(version) {
  const tag = `v${version}`;

  try {
    // Create tag
    execSync(`git tag ${tag}`, {
      stdio: 'inherit'
    });
    console.log(`✅ Created tag ${tag}`);

    // Push commit and tags
    execSync('git push origin main', {
      stdio: 'inherit'
    });
    execSync('git push origin --tags', {
      stdio: 'inherit'
    });
    console.log(`✅ Pushed tag ${tag} to remote`);
  } catch (error) {
    console.error('❌ git push failed:', error.message);
    throw error;
  }
}

function main() {
  const versionType = process.argv[2];

  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.log('Usage: node scripts/release-manual.js <patch|minor|major>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/release-manual.js patch   # 0.3.0 → 0.3.1');
    console.log('  node scripts/release-manual.js minor   # 0.3.0 → 0.4.0');
    console.log('  node scripts/release-manual.js major   # 0.3.0 → 1.0.0');
    process.exit(1);
  }

  console.log(`\n🚀 Creating manual ${versionType} release...`);
  console.log(`Current version: ${getCurrentVersion()}\n`);

  try {
    // Step 1: Run npm version (updates package.json)
    runNpmVersion(versionType);

    // Step 2: Get new version
    const newVersion = getCurrentVersion();
    console.log(`\nNew version: ${newVersion}\n`);

    // Step 3: Update Release Please manifest
    updateManifest(newVersion);

    // Step 4: Commit changes
    gitCommit(newVersion);

    // Step 5: Create and push tag
    createAndPushTag(newVersion);

    console.log(`\n✨ Release ${newVersion} created successfully!`);
    console.log(`📦 CI/CD pipeline will build and publish artifacts.\n`);
  } catch (error) {
    console.error('\n❌ Release failed!');
    process.exit(1);
  }
}

main();
