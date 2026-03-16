# GitHub Actions Build Pipeline

## Overview

Automated build pipeline for creating Electron desktop applications across multiple platforms (macOS, Windows, Linux) using GitHub Actions.

## Workflows

### 1. **build-electron.yml** - Electron App Build

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master`
- Git tags matching `v*` (e.g., `v1.0.0`)
- Manual workflow dispatch (from GitHub Actions UI)

**Platforms:**
- **macOS** - DMG + ZIP (Apple Silicon)
- **Windows** - NSIS installer + portable executable
- **Linux** - AppImage + DEB package

## Features

### Automated Builds

**On Every Push:**
- ✅ Runs tests and linting
- ✅ Builds Vue app for Electron
- ✅ Compiles Electron app
- ✅ Uploads build artifacts (30-day retention)

**On Git Tags:**
- ✅ Everything from push builds
- ✅ Creates GitHub Release
- ✅ Attaches DMG/EXE/AppImage as release assets
- ✅ Generates release notes automatically

### Manual Builds

**From GitHub Actions UI:**
1. Go to **Actions** tab in your repository
2. Select **Build Electron App** workflow
3. Click **Run workflow**
4. Choose platform(s): mac, windows, linux, or all

**From Command Line:**
```bash
# Trigger mac build
gh workflow run build-electron.yml -f platform=mac

# Trigger all platforms
gh workflow run build-electron.yml -f platform=all
```

## Build Jobs

### macOS Build (`build-mac`)

**Runner:** `macos-latest`

**Steps:**
1. Checkout repository
2. Setup Node.js 25 with caching
3. Install dependencies (`npm ci`)
4. Build Vue app with `ELECTRON_BUILD=true`
5. Verify build output
6. Build Electron app for macOS
7. Generate checksums
8. Upload artifacts:
   - `*.dmg` - macOS disk image
   - `*.zip` - ZIP archive
   - `checksums.txt` - SHA256 checksums
9. Create GitHub Release (if tagged)

**Artifacts:** `your-assistant-mac-arm64` (30 days retention)

### Windows Build (`build-windows`)

**Runner:** `windows-latest`

**Steps:**
1. Checkout repository
2. Setup Node.js 25 with caching
3. Install dependencies
4. Build Vue app with `ELECTRON_BUILD=true`
5. Build Electron app for Windows
6. Upload artifacts:
   - `*.exe` - NSIS installer
   - `*.zip` - Portable executable

**Artifacts:** `your-assistant-windows` (30 days retention)

### Linux Build (`build-linux`)

**Runner:** `ubuntu-latest`

**Steps:**
1. Checkout repository
2. Setup Node.js 25 with caching
3. Install dependencies
4. Install Electron build dependencies (fakeroot, xorriso, rpm)
5. Build Vue app with `ELECTRON_BUILD=true`
6. Build Electron app for Linux
7. Upload artifacts:
   - `*.AppImage` - Universal AppImage
   - `*.deb` - Debian package

**Artifacts:** `your-assistant-linux` (30 days retention)

## Artifact Locations

### After Build Completion

**GitHub Actions Artifacts:**
- Download from: **Actions** tab → Select workflow run → **Artifacts** section
- Retention: 30 days
- Size: ~140-150 MB per platform

**GitHub Releases:**
- Created automatically on git tags (`v*`)
- Attachments include installers and archives
- Permanent storage (until manually deleted)

### Downloading Builds

**From GitHub Actions:**
1. Go to repository → **Actions**
2. Click on **Build Electron App** workflow
3. Click on the workflow run you want
4. Scroll to **Artifacts** section
5. Download the artifact (ZIP file contains DMG/EXE)

**From GitHub Releases:**
1. Go to repository → **Releases**
2. Find the release version you want
3. Download the platform-specific installer:
   - macOS: `Your Assistant-0.1.0-arm64.dmg`
   - Windows: `Your Assistant-0.1.0-setup.exe`
   - Linux: `Your-Assistant-0.1.0.AppImage`

## Environment Variables

### Required

**GITHUB_TOKEN:**
- Automatically provided by GitHub Actions
- Used for creating releases
- Permission: `contents: write`

### Build Configuration

**ELECTRON_BUILD:**
- Set to `true` for Electron builds
- Configures Vue app to use relative paths (`./`)
- Critical for `file://` protocol support

**NODE_VERSION:**
- Set to `25` for consistency
- Matches package.json requirement (`>=24.0.0`)

## Caching Strategy

**npm Cache:**
- Caches `node_modules` between builds
- Speeds up dependency installation
- Cache key: `npm` + `lock file hash`

**Build Speed Comparison:**
- Without cache: ~2-3 minutes for `npm ci`
- With cache: ~30-45 seconds for `npm ci`

## Build Matrix

### Platform-Specific Features

| Platform | Installer | Size | Features |
|----------|-----------|------|----------|
| **macOS** | DMG + ZIP | ~140 MB | Apple Silicon, Code signing |
| **Windows** | NSIS + Portable | ~145 MB | Installer wizard, Auto-update |
| **Linux** | AppImage + DEB | ~150 MB | Universal binary, Debian/Ubuntu |

### macOS Specifics

**Architecture:** ARM64 (Apple Silicon)

**Bundle Name:** `Your Assistant.app`

**Location:** `/Applications` after installation

**System Requirements:**
- macOS 11 (Big Sur) or later
- Apple Silicon (M1/M2/M3/M4)

**Signing:**
- Not signed (development build)
- Users may need to right-click → Open on first launch

## Release Strategy

### Versioning

**Semantic Versioning:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

**Version Format:** `vX.Y.Z` where:
- X = Major version (breaking changes)
- Y = Minor version (new features)
- Z = Patch version (bug fixes)

### Release Checklist

Before creating a release tag:

1. ✅ Update version in `package.json`
2. ✅ Update CHANGELOG.md
3. ✅ Test all features locally
4. ✅ Ensure tests pass: `npm test`
5. ✅ Commit all changes

Creating the release:

```bash
# Update version
npm version patch  # or minor, or major

# Push changes
git push

# Tag and push
git push origin main --tags
```

GitHub Actions will automatically:
- Build all platforms
- Create GitHub Release
- Attach installers as release assets

## Troubleshooting

### Build Failures

**Issue:** Build fails with "dist directory not found"
- **Cause:** Vue build failed
- **Fix:** Check build logs for Vue compilation errors

**Issue:** Build fails with "app.asar not found"
- **Cause:** electron-builder packaging failed
- **Fix:** Check electron-builder configuration in package.json

**Issue:** macOS build fails on Ubuntu runner
- **Cause:** macOS requires macOS runner
- **Fix:** Use `runs-on: macos-latest` (already configured)

### Artifact Issues

**Issue:** Artifacts not uploaded
- **Cause:** Build failed or timeout
- **Fix:** Check workflow logs for specific errors

**Issue:** Release not created on tag
- **Cause:** Tag doesn't match `v*` pattern
- **Fix:** Ensure tag format: `v1.0.0` (not `1.0.0`)

### Caching Issues

**Issue:** Cache not working, builds are slow
- **Cause:** Cache key changed (lock file updated)
- **Fix:** Expected behavior, cache will rebuild

**Issue:** npm ci fails with cache error
- **Cause:** Corrupted cache
- **Fix:** Clear cache manually or wait for automatic expiration

## Workflow Configuration

### Concurrency Control

**Group:** "pages" (for deploy workflow)
**Cancel-in-progress:** Yes

**Electron builds do NOT use concurrency control** - they run independently and simultaneously.

### Parallel Execution

**All platforms build simultaneously** when triggered by:
- Push to main/master
- Tag creation
- Manual dispatch with `platform: all`

**Single platform builds** when:
- Manual dispatch with specific platform
- Pull request (tests only, no artifacts)

### Permissions Required

```yaml
permissions:
  contents: write      # For creating releases
  id-token: write       # For OIDC token
```

## Local vs Remote Build

### Local Build

```bash
npm run electron:build:mac
```

**Pros:**
- Faster iteration
- Full control over build process
- Can test immediately

**Cons:**
- Platform-specific (can't build Windows on Mac)
- No automatic releases
- Manual artifact management

### Remote Build (GitHub Actions)

```bash
git push origin main
```

**Pros:**
- All platforms built simultaneously
- Automatic release creation
- Artifact storage and sharing
- CI/CD integration

**Cons:**
- Slower initial build (no cache)
- Requires internet connection
- Limited to GitHub Actions environment

## Security Considerations

### Secrets Management

**No secrets required** for this workflow! Everything is self-contained:
- Build scripts use public APIs
- Electron-builder doesn't require credentials
- GitHub token provided automatically

### Code Signing

**Current Status:** Unsigned (development builds)

**Production Signing:**
- Requires Apple Developer certificate
- Requires Windows code signing certificate
- Not implemented in current workflow

**Warning:** macOS may show "unidentified developer" warning:
- Right-click → Open
- Or: System Preferences → Security → Open Anyway

## Monitoring and Notifications

### Build Status

**View in:**
- GitHub Actions tab
- Repository home page (checks/fails)
- Pull request checks (✅/❌)

**Notifications:**
- Email notifications (configure in GitHub settings)
- Slack/Discord integrations (via webhooks)

### Build Metrics

**Typical Build Times:**
- macOS: ~8-12 minutes
- Windows: ~10-15 minutes
- Linux: ~6-10 minutes

**Factors affecting time:**
- Cache hit/miss
- GitHub Actions queue time
- Runner performance
- Build complexity

## Advanced Usage

### Scheduled Builds

**Add scheduled builds:**
```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday at midnight
    workflow_dispatch:
```

### Conditional Builds

**Build only on specific changes:**
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'electron/**'
      - 'package.json'
```

### Matrix Builds

**Multiple Node versions:**
```yaml
strategy:
  matrix:
    node-version: [24.x, 25.x]
```

## Best Practices

### Before Pushing

1. ✅ Run tests locally: `npm test`
2. ✅ Check formatting: `npm run format:check`
3. ✅ Verify linting: `npm run lint:check`
4. ✅ Test Electron build locally: `npm run electron:build:mac`
5. ✅ Update CHANGELOG with changes

### Release Process

1. **Update version:** `npm version minor`
2. **Review changes:** `git diff`
3. **Commit changes:** `git commit -m "chore: release v1.1.0"`
4. **Push to main:** `git push`
5. **Create tag:** `git tag v1.1.0`
6. **Push tag:** `git push origin v1.1.0`
7. **Monitor build:** Watch Actions tab for progress

### After Release

1. ✅ Download and test artifacts
2. ✅ Verify installation works
3. ✅ Test all features in built app
4. ✅ Update documentation if needed
5. ✅ Announce release to users

## Next Steps

### Future Enhancements

**Consider adding:**
- Code signing certificates (production builds)
- Auto-update support
- Release channel management (stable/beta/alpha)
- Crash reporting integration
- Analytics/metrics

**CI/CD Improvements:**
- Parallel testing across platforms
- Smoke tests on built artifacts
- Automated release notes generation
- Deploy to multiple distribution channels

## Related Documentation

- **[QUICK_START.md](QUICK_START.md)** - Getting started guide
- **[ELECTRON_GREY_WINDOW_FIX.md](ELECTRON_GREY_WINDOW_FIX.md)** - Troubleshooting Electron builds
- **[DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)** - Development setup

## Support

**Issues:** Report build failures via GitHub Issues

**Questions:** Check existing issues or discussions first

**Contributions:** Pull requests for workflow improvements welcome!
