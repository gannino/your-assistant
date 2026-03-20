#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const SVG_PATH = path.join(__dirname, '../public/favicon.svg');
const BUILD_DIR = path.join(__dirname, '../build');
const SIZES = [16, 32, 64, 128, 256, 512, 1024];

async function generateIcons() {
  console.log('🎨 Generating application icons...');

  // Ensure build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  // Create iconset directory for macOS
  const iconsetDir = path.join(BUILD_DIR, 'your-assistant.iconset');
  if (!fs.existsSync(iconsetDir)) {
    fs.mkdirSync(iconsetDir, { recursive: true });
  }

  // Load the SVG
  const svgContent = fs.readFileSync(SVG_PATH, 'utf-8');

  // Generate PNG icons for different sizes
  for (const size of SIZES) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Create an image from the SVG
    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
        const pngBuffer = canvas.toBuffer('image/png');

        // Save PNG for iconset
        const pngPath = path.join(iconsetDir, `icon_${size}x${size}.png`);
        fs.writeFileSync(pngPath, pngBuffer);

        console.log(`✅ Generated ${size}x${size} PNG`);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  console.log('✅ Icon files generated in build/your-assistant.iconset');
  console.log('💡 Run "iconutil -c build/your-assistant.iconset -o build/icon.icns" to create macOS .icns');
  console.log('💡 Use an online tool like https://icoconvert.com to create .ico from the PNGs');
}

generateIcons().catch(err => {
  console.error('❌ Failed to generate icons:', err);
  process.exit(1);
});
