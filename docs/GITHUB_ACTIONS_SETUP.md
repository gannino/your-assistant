# GitHub Actions CI/CD Setup Guide

This guide explains the automated CI/CD pipeline for Your Assistant.

## Overview

The repository uses a **single consolidated CI/CD pipeline** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) that handles:

- ✅ Code quality checks (linting, formatting)
- ✅ Automated testing across Node.js versions
- ✅ Electron app builds for macOS, Windows, and Linux
- ✅ Automatic version bumping and releases
- ✅ GitHub Pages deployment

## Workflow Architecture

### Trigger Conditions

**On Pull Requests:**
- Quality checks (lint, format)
- Tests across Node 24.x and 25.x
- Build verification

**On Push to `main`:**
- All quality checks and tests
- Build Electron apps for all platforms
- Deploy to GitHub Pages
- **Auto-create release** (bumps version, creates tag)

**On Tag Push (`v*`):**
- All quality checks and tests
- Build Electron apps for all platforms
- **Create GitHub Release** with installer artifacts

### Pipeline Stages

#### Stage 1: Setup and Quality
```yaml
setup:
  - Checkout code
  - Install dependencies (with npm cache)
  - Run lint checks
  - Run format checks
  - Build Vue app for web
  - Upload artifacts (dist/)
```

#### Stage 2: Testing (Matrix)
```yaml
test (Node 24.x, 25.x in parallel):
  - Download artifacts
  - Run tests with coverage
  - Upload coverage reports
```

#### Stage 3: Electron Build Base
```yaml
build-electron-base:
  - Download artifacts
  - Build Vue app for Electron
  - Upload artifacts (electron-dist/)
```

#### Stage 4: Platform Builds (Parallel)
```yaml
build-mac (macOS-latest):
  - Build macOS Electron app (.dmg, .zip)
  - Generate checksums
  - Upload artifacts

build-windows (windows-latest):
  - Build Windows Electron app (.exe, .zip)
  - Upload artifacts

build-linux (ubuntu-latest):
  - Install system dependencies
  - Build Linux Electron app (.AppImage, .deb)
  - Upload artifacts
```

#### Stage 5: Deployments
```yaml
deploy-pages (on push to main):
  - Download web build artifacts
  - Deploy to GitHub Pages
  - Verify deployment

auto-release (on push to main, after builds succeed):
  - Bump version (patch)
  - Update package.json
  - Commit version bump
  - Create and push tag

release (on tag push):
  - Download all platform artifacts
  - Create GitHub Release
  - Upload all installers
  - Generate release notes
```

## Automatic Releases

Every merge to `main` triggers an **automatic release**:

### Version Bumping

- **Automatic**: Patch version incremented (1.0.0 → 1.0.1 → 1.0.2...)
- **Manual**: For major/minor versions, edit `package.json` before merging

### Generated Artifacts

Each release includes:

**macOS:**
- `Your Assistant-<version>-arm64.dmg` - Disk image installer
- `Your Assistant-<version>-arm64-mac.zip` - ZIP archive
- `checksums.txt` - SHA256 checksums

**Windows:**
- `Your Assistant-Setup <version>.exe` - NSIS installer
- `Your Assistant-<version>-win.zip` - Portable ZIP

**Linux:**
- `Your-Assistant-<version>.AppImage` - Universal AppImage
- `your-assistant_<version>_amd64.deb` - Debian package

### Release Process

**Two-Run Architecture:**

1. **Run 1 (push to main)**: Validates everything, creates tag
2. **Run 2 (tag push)**: Builds release, creates GitHub Release

This ensures:
- ✅ Only working code gets released
- ✅ Release is properly tagged
- ✅ Artifacts are built fresh for release

## Setup Requirements

### 1. Enable GitHub Pages

1. Go to repository **Settings**
2. Click **Pages** in left sidebar
3. Under "Source", select **GitHub Actions**
4. Click **Save**

### 2. Configure Permissions

The workflow requires these permissions (already configured):

```yaml
permissions:
  contents: write      # For creating releases and tags
  pages: write         # For GitHub Pages deployment
  id-token: write      # For OIDC token requests
```

### 3. GitHub Pages Settings (Optional)

For custom domains or advanced configuration:

1. Add `CNAME` file to repository root
2. Configure DNS with your provider
3. GitHub Pages will use the custom domain automatically

## Monitoring and Troubleshooting

### View Workflow Runs

**All Workflows:**
```
https://github.com/gannino/your-assistant/actions
```

**Specific Run:**
Click on any run to see detailed logs for each job

### View Releases

**All Releases:**
```
https://github.com/gannino/your-assistant/releases
```

**Latest Release:**
```
https://github.com/gannino/your-assistant/releases/latest
```

### Common Issues

#### Build Failures

**Symptoms**: Electron builds fail on specific platforms

**Solutions**:
- Check the platform-specific job logs
- Verify `cross-env` is in devDependencies
- Ensure environment variables are set correctly
- Check Node.js version compatibility

#### Release Not Created

**Symptoms**: Tag created but no GitHub Release

**Solutions**:
- Verify the tag starts with `v` (e.g., v1.0.1)
- Check that all build jobs succeeded
- Ensure workflow has `contents: write` permission
- Look for errors in the `release` job logs

#### Test Failures

**Symptoms**: Tests pass locally but fail in CI

**Solutions**:
- Check Node.js version (CI uses 24.x, 25.x)
- Verify `package-lock.json` is committed
- Run `npm ci` locally to reproduce CI environment
- Check for platform-specific differences

## Workflow Customization

### Change Node.js Versions

Edit `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    node-version: [24.x, 25.x]  # Add or remove versions
```

### Disable Auto-Release

To disable automatic releases on merge:

1. Comment out or remove the `auto-release` job
2. Manually create tags for releases: `git tag v1.0.1 && git push origin v1.0.1`

### Add Manual Release Trigger

Add manual workflow_dispatch trigger:

```yaml
on:
  push:
    branches: [main, master]
    tags:
      - 'v*'
  pull_request:
    branches: [main, master]
  workflow_dispatch:  # Enable manual triggering
```

Then manually trigger from Actions tab → CI/CD → Run workflow

## Performance Optimization

### Current Performance

- **Dependencies**: Installed once per job with npm cache (~10 seconds)
- **Vue Builds**: Built 2 times (web + Electron)
- **Parallel Execution**: Tests and platform builds run in parallel
- **Total Time**: ~6-8 minutes for full pipeline

### Optimization Opportunities

1. **Cache Electron binaries** (saves 2-3 minutes)
2. **Use Docker layer caching** (experimental)
3. **Split workflow** for PR vs main (PRs don't need builds)

## Security Considerations

### Secret Management

The workflow uses:
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- No API keys required (app uses localStorage)
- All secrets stored in GitHub repository settings

### Permissions

Workflow follows principle of least privilege:
- `contents: write` - Only for releases and tags
- `pages: write` - Only for GitHub Pages deployment
- `id-token: write` - Only for OIDC (if needed)

## Best Practices

1. **Test Locally First**: Run `npm run lint:check` and `npm test` before pushing
2. **Review Workflow Logs**: Check Actions tab after each push
3. **Monitor Releases**: Verify releases are created correctly
4. **Keep Dependencies Updated**: Regularly update npm packages
5. **Use Semantic Commits**: Follow conventional commit format for better changelogs

## Support

For issues or questions:

1. **Check workflow logs**: Actions tab → Click on run → View job logs
2. **Review this guide**: Ensure setup requirements are met
3. **Check troubleshooting**: See Common Issues section above
4. **Create issue**: Include logs and error messages

## Related Documentation

- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Local development setup
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[README](../README.md)** - Project overview and quick start
