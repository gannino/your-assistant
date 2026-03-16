/**
 * Research NPM Package using NPM Registry API
 *
 * Usage: node scripts/research-npm-api.js <package-name>
 * Example: node scripts/research-npm-api.js @openrouter/ai-sdk-provider
 */

const https = require('https');

async function fetchPackageInfo(packageName) {
  return new Promise((resolve, reject) => {
    const url = `https://registry.npmjs.org/${packageName}`;
    console.log(`\n🔍 Fetching: ${url}`);

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function formatNumber(num) {
  if (!num) return 'N/A';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

async function researchNpmPackage(packageName) {
  try {
    console.log(`\n📦 Researching: ${packageName}`);
    console.log('='.repeat(70));

    const data = await fetchPackageInfo(packageName);

    const latest = data['dist-tags']?.latest || 'N/A';
    const info = data.versions?.[latest] || {};
    const latestVersion = data.versions?.[latest] || Object.values(data.versions || {})[0] || {};

    // Extract key information
    const packageInfo = {
      name: data.name || 'N/A',
      version: latest,
      description: latestVersion.description || 'No description',
      author: latestVersion.author?.name || latestVersion.author || 'N/A',
      license: latestVersion.license || 'N/A',
      homepage: latestVersion.homepage || 'N/A',
      repository: latestVersion.repository?.url || latestVersion.repository || 'N/A',
      keywords: latestVersion.keywords || [],
      dependencies: Object.keys(latestVersion.dependencies || {}),
      peerDependencies: Object.keys(latestVersion.peerDependencies || {}),
      devDependencies: Object.keys(latestVersion.devDependencies || {}),
      weeklyDownloads: formatNumber(data.time ? Object.keys(data.time).length : 0),
      // This is a rough estimate based on versions count
    };

    // Display results
    console.log('\n📋 Package Information:');
    console.log('─'.repeat(70));
    console.log(`Name:              ${packageInfo.name}`);
    console.log(`Latest Version:     ${packageInfo.version}`);
    console.log(`Description:        ${packageInfo.description}`);
    console.log(`Author:            ${packageInfo.author}`);
    console.log(`License:           ${packageInfo.license}`);
    console.log(`Homepage:          ${packageInfo.homepage}`);
    console.log(`Repository:        ${packageInfo.repository}`);

    if (packageInfo.keywords.length > 0) {
      console.log(`\n🏷️  Keywords:`);
      packageInfo.keywords.forEach(kw => console.log(`   - ${kw}`));
    }

    if (packageInfo.dependencies.length > 0) {
      console.log(`\n📦 Dependencies (${packageInfo.dependencies.length}):`);
      packageInfo.dependencies.forEach(dep => console.log(`   - ${dep}`));
    }

    if (packageInfo.peerDependencies.length > 0) {
      console.log(`\n🔗 Peer Dependencies (${packageInfo.peerDependencies.length}):`);
      packageInfo.peerDependencies.forEach(dep => console.log(`   - ${dep}`));
    }

    // Check for AI SDK integration
    console.log('\n🤖 AI SDK Integration:');
    console.log('─'.repeat(70));
    const allDeps = [
      ...packageInfo.dependencies,
      ...packageInfo.peerDependencies
    ];

    if (allDeps.some(dep => dep.includes('ai') || dep.includes('vercel'))) {
      console.log('✅ Detected Vercel AI SDK integration');
    }
    if (allDeps.some(dep => dep.includes('openai'))) {
      console.log('✅ Detected OpenAI integration');
    }
    if (allDeps.some(dep => dep.includes('anthropic'))) {
      console.log('✅ Detected Anthropic integration');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Research complete!\n');

    return packageInfo;

  } catch (error) {
    console.error(`\n❌ Error researching package: ${error.message}`);
    throw error;
  }
}

// Get package name from command line
const packageName = process.argv[2];

if (!packageName) {
  console.error('Usage: node scripts/research-npm-api.js <package-name>');
  console.error('Example: node scripts/research-npm-api.js @openrouter/ai-sdk-provider');
  process.exit(1);
}

researchNpmPackage(packageName).catch(error => {
  console.error('Research failed:', error);
  process.exit(1);
});
