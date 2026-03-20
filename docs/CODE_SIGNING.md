# Code Signing Guide — Your Assistant

## Overview

macOS requires apps to be properly code-signed with entitlements for system permissions (microphone, camera, screen recording) to work correctly. Without proper signing, macOS will silently deny permission requests, causing the app to fail or loop endlessly.

This guide covers how to set up code signing for local development and automated GitHub Actions builds.

---

## Why Code Signing is Required

### The Problem Without Signing

When an Electron app is built without a Developer ID certificate:
- electron-builder uses **adhoc signing** (self-signed, no identity)
- Adhoc signing **ignores entitlements** — they are not embedded in the binary
- macOS TCC (Transparency, Consent, and Control) checks for entitlements before showing permission prompts
- Without entitlements, macOS silently denies microphone/camera/screen recording access
- Result: The app loops endlessly requesting permissions that can never be granted

### What Proper Signing Provides

With a valid Apple Developer ID certificate:
- Entitlements are embedded in the app binary
- macOS recognizes the app and shows TCC permission prompts
- Users can grant/deny permissions in System Settings
- The app can be notarized for Gatekeeper (required for distribution)

---

## Prerequisites

### 1. Apple Developer Account

You need an **Apple Developer Program** membership ($99/year):
- Individual or Organization account
- Enroll at: https://developer.apple.com/programs/

### 2. Developer ID Certificate

Two certificates are needed:
- **Developer ID Application** — for signing the app
- **Developer ID Installer** (optional) — for signing `.pkg` installers

---

## Part 1: Generate Certificates (One-Time Setup)

### Option A: Using Xcode (Recommended for Beginners)

1. Open **Xcode** → Preferences → Accounts
2. Add your Apple ID (the one enrolled in the Developer Program)
3. Select your team → Click **Manage Certificates**
4. Click **+** → Select **Developer ID Application**
5. Xcode will generate and download the certificate automatically

### Option B: Using Apple Developer Portal (Advanced)

1. Go to https://developer.apple.com/account/resources/certificates/list
2. Click **+** to create a new certificate
3. Select **Developer ID Application**
4. Follow the instructions to generate a Certificate Signing Request (CSR):
   ```bash
   # On your Mac, open Keychain Access
   # Menu: Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
   # Enter your email, select "Saved to disk"
   ```
5. Upload the CSR file
6. Download the certificate (`.cer` file)
7. Double-click to install it in your Keychain

### Verify Certificate Installation

```bash
# List all Developer ID certificates in your Keychain
security find-identity -v -p codesigning

# You should see something like:
# 1) ABCDEF1234567890 "Developer ID Application: Your Name (TEAM_ID)"
```

Copy the **certificate name** (the part in quotes) — you'll need it later.

---

## Part 2: Export Certificate for CI/CD

GitHub Actions runners don't have access to your Mac's Keychain, so you need to export the certificate and upload it as a secret.

### Step 1: Export Certificate and Private Key

```bash
# Export the certificate + private key as a .p12 file
# Replace "Developer ID Application: Your Name (TEAM_ID)" with your actual certificate name
security find-identity -v -p codesigning | grep "Developer ID Application"

# Export to a .p12 file (you'll be prompted to set a password)
security export -t identities -f pkcs12 \
  -o ~/Desktop/DeveloperID_Application.p12 \
  -P "YOUR_STRONG_PASSWORD_HERE"
```

**Important**: Choose a strong password and save it securely — you'll need it in GitHub Secrets.

### Step 2: Convert .p12 to Base64

GitHub Secrets can't store binary files directly, so encode it as base64:

```bash
# Encode the .p12 file to base64
base64 -i ~/Desktop/DeveloperID_Application.p12 -o ~/Desktop/certificate.base64.txt

# The output file contains a long base64 string
cat ~/Desktop/certificate.base64.txt
```

Copy the entire base64 string (it will be very long, ~4000+ characters).

### Step 3: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `MACOS_CERTIFICATE` | `<base64 string from certificate.base64.txt>` | Base64-encoded .p12 certificate |
| `MACOS_CERTIFICATE_PWD` | `<password you set when exporting>` | Password for the .p12 file |
| `APPLE_ID` | `your-apple-id@example.com` | Your Apple ID email (for notarization) |
| `APPLE_APP_SPECIFIC_PASSWORD` | `<app-specific password>` | App-specific password (see below) |
| `APPLE_TEAM_ID` | `ABCD123456` | Your 10-character Team ID |

### Step 4: Generate App-Specific Password (for Notarization)

Notarization requires an app-specific password (not your Apple ID password):

1. Go to https://appleid.apple.com/account/manage
2. Sign in with your Apple ID
3. Under **Security** → **App-Specific Passwords** → Click **Generate Password**
4. Label it "GitHub Actions Notarization"
5. Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`)
6. Add it as `APPLE_APP_SPECIFIC_PASSWORD` in GitHub Secrets

### Step 5: Find Your Team ID

```bash
# List your teams
xcrun altool --list-providers -u "your-apple-id@example.com" -p "@keychain:AC_PASSWORD"

# Or check in Apple Developer portal:
# https://developer.apple.com/account → Membership → Team ID
```

Your Team ID is a 10-character alphanumeric string (e.g., `ABCD123456`).

---

## Part 3: Update GitHub Actions Workflow

### Modify `.github/workflows/ci.yml`

Update the `build-mac` job to use the signing secrets:

```yaml
build-mac:
  name: Build macOS App
  runs-on: macos-latest
  needs: build-apps
  if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master' || startsWith(github.ref, 'refs/tags/'))

  steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '24'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Download Electron Vue build artifact
      uses: actions/download-artifact@v4
      with:
        name: vue-dist-electron
        path: dist/

    # ── NEW: Import code signing certificate ──────────────────────────
    - name: Import Code Signing Certificate
      env:
        MACOS_CERTIFICATE: ${{ secrets.MACOS_CERTIFICATE }}
        MACOS_CERTIFICATE_PWD: ${{ secrets.MACOS_CERTIFICATE_PWD }}
      run: |
        # Create a temporary keychain
        KEYCHAIN_PATH=$RUNNER_TEMP/app-signing.keychain-db
        KEYCHAIN_PASSWORD=$(openssl rand -base64 32)
        
        # Decode the certificate
        echo "$MACOS_CERTIFICATE" | base64 --decode > certificate.p12
        
        # Create keychain
        security create-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
        security set-keychain-settings -lut 21600 "$KEYCHAIN_PATH"
        security unlock-keychain -p "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
        
        # Import certificate
        security import certificate.p12 -k "$KEYCHAIN_PATH" -P "$MACOS_CERTIFICATE_PWD" -T /usr/bin/codesign
        security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASSWORD" "$KEYCHAIN_PATH"
        
        # Set as default keychain
        security list-keychain -d user -s "$KEYCHAIN_PATH"
        
        # Verify certificate
        security find-identity -v -p codesigning "$KEYCHAIN_PATH"
        
        # Clean up
        rm certificate.p12

    # ── Build with signing ─────────────────────────────────────────────
    - name: Build Electron app for macOS (Universal)
      run: npx electron-builder --mac --universal
      env:
        GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES: true
        # Code signing environment variables
        CSC_LINK: ${{ secrets.MACOS_CERTIFICATE }}
        CSC_KEY_PASSWORD: ${{ secrets.MACOS_CERTIFICATE_PWD }}
        # Notarization environment variables
        APPLE_ID: ${{ secrets.APPLE_ID }}
        APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
        APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}

    # ── Verify signing ─────────────────────────────────────────────────
    - name: Verify Code Signature
      run: |
        echo "Verifying code signature..."
        APP_PATH=$(find release -name "*.app" -type d | head -1)
        if [ -n "$APP_PATH" ]; then
          codesign -dv --verbose=4 "$APP_PATH"
          codesign --verify --deep --strict --verbose=2 "$APP_PATH"
          echo "✅ Code signature verified"
        else
          echo "❌ No .app bundle found"
          exit 1
        fi

    - name: Find and generate build checksums
      run: |
        cd release
        find . -type f \( -name "*.dmg" -o -name "*.zip" \) -exec shasum -a 256 {} \; > checksums.txt
        cat checksums.txt

    - name: Upload macOS artifacts
      uses: actions/upload-artifact@v4
      with:
        name: your-assistant-mac
        path: |
          release/*.dmg
          release/*.zip
          release/checksums.txt
        retention-days: 30
```

---

## Part 4: Enable Notarization (Optional but Recommended)

Notarization allows your app to pass Gatekeeper on macOS 10.15+. Users won't see "unidentified developer" warnings.

### Update `package.json`

Add notarization configuration to the `build.mac` section:

```json
{
  "build": {
    "mac": {
      "category": "public.app-category.productivity",
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns",
      "entitlements": "electron/entitlements.mac.plist",
      "entitlementsInherit": true,
      "hardenedRuntime": true,
      "gatekeeperAssess": false,
      "extendInfo": "electron/Info.plist",
      "notarize": {
        "teamId": "${APPLE_TEAM_ID}"
      }
    }
  }
}
```

electron-builder will automatically notarize when `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are set.

---

## Part 5: Local Development Signing

For local builds, you can sign with your certificate:

```bash
# Build and sign locally
npm run electron:build:mac

# electron-builder will automatically use your Keychain certificate
# if CSC_LINK and CSC_KEY_PASSWORD are not set
```

To skip signing during development:

```bash
# Skip code signing (for testing only)
CSC_IDENTITY_AUTO_DISCOVERY=false npm run electron:build:mac
```

---

## Troubleshooting

### "No identity found" error

**Cause**: Certificate not found in Keychain or GitHub Secrets not set correctly.

**Fix**:
```bash
# Verify certificate is in Keychain
security find-identity -v -p codesigning

# Check GitHub Secrets are set (in repo Settings → Secrets)
```

### "errSecInternalComponent" error

**Cause**: Keychain password or partition list issue.

**Fix**: The workflow script handles this with `security set-key-partition-list`. If it still fails, regenerate the .p12 file.

### Notarization fails with "Invalid credentials"

**Cause**: Wrong Apple ID or app-specific password.

**Fix**:
1. Verify `APPLE_ID` is correct
2. Regenerate app-specific password at https://appleid.apple.com
3. Update `APPLE_APP_SPECIFIC_PASSWORD` secret

### "The specified item could not be found in the keychain"

**Cause**: Certificate expired or revoked.

**Fix**: Generate a new Developer ID certificate in Apple Developer portal.

### App still shows "unidentified developer" warning

**Cause**: Notarization not completed or failed.

**Fix**:
1. Check GitHub Actions logs for notarization errors
2. Verify all notarization secrets are set
3. Wait 5-10 minutes after build — notarization is asynchronous

---

## Security Best Practices

### 1. Protect Your Secrets

- **Never commit** `.p12` files or passwords to git
- Use GitHub Secrets for all sensitive data
- Rotate app-specific passwords periodically

### 2. Limit Secret Access

- Use environment-specific secrets (production vs. staging)
- Restrict who can access repository secrets
- Use branch protection rules to prevent unauthorized builds

### 3. Certificate Expiration

- Developer ID certificates expire after 5 years
- Set a calendar reminder to renew before expiration
- Update GitHub Secrets when you renew

### 4. Audit Builds

- Review GitHub Actions logs for signing/notarization status
- Verify signatures locally before distribution:
  ```bash
  codesign -dv --verbose=4 "Your Assistant.app"
  spctl -a -vv "Your Assistant.app"
  ```

---

## Verification Checklist

After setting up code signing, verify everything works:

- [ ] Certificate is installed in Keychain
- [ ] All 5 GitHub Secrets are set correctly
- [ ] GitHub Actions build completes without errors
- [ ] Downloaded `.app` has valid signature: `codesign -dv "Your Assistant.app"`
- [ ] Entitlements are embedded: `codesign -d --entitlements - "Your Assistant.app"`
- [ ] App passes Gatekeeper: `spctl -a -vv "Your Assistant.app"`
- [ ] Microphone permission prompt appears on first launch
- [ ] Screen recording permission prompt appears when capturing

---

## References

- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Notarizing macOS Software](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

## Quick Reference: Required Secrets

| Secret | How to Get It | Example |
|--------|---------------|---------|
| `MACOS_CERTIFICATE` | Export cert as .p12, encode to base64 | `MIIKvAIBAzCCCn...` (very long) |
| `MACOS_CERTIFICATE_PWD` | Password you set when exporting .p12 | `MySecureP@ssw0rd!` |
| `APPLE_ID` | Your Apple Developer account email | `dev@example.com` |
| `APPLE_APP_SPECIFIC_PASSWORD` | Generate at appleid.apple.com | `xxxx-xxxx-xxxx-xxxx` |
| `APPLE_TEAM_ID` | Apple Developer portal → Membership | `ABCD123456` |

---

**Next Steps**: After completing this setup, rebuild the app and test that microphone/camera/screen recording permissions work correctly.
