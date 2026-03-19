#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing deployment build...\n');

const distDir = path.join(__dirname, '..', 'dist');

// Check critical files exist
const criticalFiles = ['index.html', 'manifest.json', 'favicon-32x32.png', 'favicon-16x16.png'];

let allGood = true;

criticalFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allGood = false;
  }
});

// Check index.html for asset references
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// Check bundle size
const jsFiles = fs.readdirSync(path.join(distDir, 'js'));
let totalSize = 0;

jsFiles.forEach(file => {
  const stats = fs.statSync(path.join(distDir, 'js', file));
  totalSize += stats.size;
});

const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
console.log(`\n📦 Total JS bundle size: ${sizeMB} MB`);

if (totalSize > 2 * 1024 * 1024) {
  console.log('⚠️  WARNING: Bundle size exceeds 2MB');
} else {
  console.log('✅ Bundle size is acceptable');
}

if (allGood) {
  console.log('\n✅ Deployment build looks good!');
  console.log('Run `npm run preview` to test locally');
  process.exit(0);
} else {
  console.log('\n❌ Deployment build has issues');
  process.exit(1);
}
