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
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}\n`);
  console.log('🚀 You can now run: npm run serve:https');
  process.exit(0);
}

console.log('Generating self-signed certificate...\n');

try {
  // Generate private key
  console.log('1. Generating private key...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });

  // Generate certificate
  console.log('\n2. Generating self-signed certificate...');
  const certCommand = `openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/CN=localhost"`;
  execSync(certCommand, { stdio: 'inherit' });

  console.log('\n✅ Certificates generated successfully!');
  console.log(`   Private Key: ${keyPath}`);
  console.log(`   Certificate: ${certPath}`);

  console.log('\n🔒 Security Note:');
  console.log('   - These are self-signed certificates for development only');
  console.log('   - Your browser will show a security warning');
  console.log('   - Click "Advanced" → "Proceed to localhost (unsafe)"');

  console.log('\n🚀 Next steps:');
  console.log('   1. Run: npm run serve:https');
  console.log('   2. Visit: https://localhost:8081');
  console.log('   3. Accept the security warning in your browser');

  console.log('\n📱 For iOS Safari:');
  console.log('   - Go to Settings → Safari → Privacy & Security');
  console.log('   - Enable "Allow HTTP websites" if needed');
  console.log('   - Visit https://localhost:8081 and accept the certificate');
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('\n💡 Alternative: Install OpenSSL or use mkcert');
  console.log('   - macOS: brew install openssl');
  console.log('   - Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   - Or use: npm install -g mkcert');
  process.exit(1);
}
