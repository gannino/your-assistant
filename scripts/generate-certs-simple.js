#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Generating HTTPS certificates for development...\n');

// Create certs directory
const certsDir = path.resolve(__dirname, '..', 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Created certs directory');
}

const keyPath = path.join(certsDir, 'server.key');
const certPath = path.join(certsDir, 'server.crt');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('⚠️  Certificates already exist. Skipping generation.');
  process.exit(0);
}

console.log('Generating self-signed certificate...\n');

try {
  // Generate private key
  console.log('1. Generating private key...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

  // Generate certificate
  console.log('\n2. Generating self-signed certificate...');
  const certCommand = `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`;
  execSync(certCommand, { stdio: 'inherit' });

  console.log('\n✅ Certificates generated successfully!');
  console.log(`   Private Key: ${keyPath}`);
  console.log(`   Certificate: ${certPath}`);

  console.log('\n🚀 You can now run: npm run serve:https');
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  process.exit(1);
}
