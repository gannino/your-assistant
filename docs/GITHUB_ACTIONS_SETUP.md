# GitHub Actions CI/CD Setup Guide

This guide explains the automated CI/CD pipeline for Your Assistant.

## Overview

The repository uses **Release Please** for automated version management and releases, combined with a **consolidated CI/CD pipeline** ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) that handles:

- ✅ Code quality checks (linting, formatting)
- ✅ Automated testing across Node.js versions
- ✅ Electron app builds for macOS, Windows, and Linux
- ✅ Automated version management via Release Please
- ✅ GitHub Pages deployment

For detailed release process information, see [Release Process](./RELEASE_PROCESS.md).

## Workflow Architecture

### Workflows

The project uses two GitHub Actions workflows:

1. **[Release Please](../.github/workflows/release-please.yml)** - Automated version management
2. **[CI/CD](../.github/workflows/ci.yml)** - Quality checks, builds, and deployments

### Trigger Conditions

**Release Please Workflow:**

- **On push to `main`**: Analyzes commits, creates release PRs
- **Manual trigger**: Can be triggered manually from GitHub UI

**CI/CD Workflow:**

- **On Pull Requests:**
  - Quality checks (lint, format)
  - Tests across Node 24.x and 25.x
  - Build verification

- **On Push to `main`:**
  - All quality checks and tests
  - Build Electron apps for all platforms
  - Deploy to GitHub Pages

- **On Tag Push (`v*`)**: (triggered by Release Please)
  - All quality checks and tests
  - Build Electron apps for all platforms
  - **Create GitHub Release** with installer artifacts

### Pipeline Stages

#### Stage 1: Setup and Build
```yaml
setup-build:
  - Checkout code
  - Setup Node.js with optimized npm cache
  - Install dependencies once (with hash-based cache)
  - Cache node_modules for downstream jobs
```

#### Stage 2: Quality & Testing (Parallel)
```yaml
lint-format (parallel with test):
  - Restore node_modules from cache
  - Run lint checks
  - Run format checks

test (Node 24.x, 25.x matrix, parallel):
  - Restore node_modules from cache
  - Run tests with coverage
  - Upload coverage reports
```

#### Stage 3: Build Apps
```yaml
build-apps:
  - Restore node_modules from cache
  - Build Vue app for web (GitHub Pages)
  - Build Vue app for Electron (desktop apps)
  - Upload both build artifacts
```

#### Stage 4: Platform Builds (Parallel)
```yaml
build-mac (macOS-latest):
  - Download Electron Vue build artifact
  - Install dependencies (platform-specific native modules)
  - Build macOS Electron app (.dmg, .zip)
  - Generate checksums
  - Upload artifacts

build-windows (windows-latest):
  - Download Electron Vue build artifact
  - Install dependencies (platform-specific native modules)
  - Build Windows Electron app (.exe, .zip)
  - Upload artifacts

build-linux (ubuntu-latest):
  - Download Electron Vue build artifact
  - Install dependencies (platform-specific native modules)
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

release (on tag push from Release Please or manual):
  - Download all platform artifacts
  - Create GitHub Release
  - Upload all installers
  - Generate release notes
```

## Automatic Releases with Release Please

This project uses **Release Please**, Google's industry-standard automated release management solution.

### How Release Please Works

1. **Development Phase**: Make commits with conventional commit format
   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug"
   ```

2. **Release PR Creation**: Release Please automatically creates a release PR
   - Bumps version based on commit types
   - Generates changelog
   - Updates package.json

3. **Release Creation**: On merge of the Release PR
   - Tag is created (e.g., v1.0.4)
   - CI/CD builds all platforms
   - GitHub Release created with artifacts

### Version Bumping

Release Please automatically determines version bumps based on commit types:

- `feat:` → Patch bump (1.0.3 → 1.0.4)
- `fix:` → Patch bump (1.0.3 → 1.0.4)
- `feat!:` → Major bump (1.0.3 → 2.0.0)
- `fix!:` → Minor bump (1.0.3 → 1.1.0)

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

**Industry-Standard Release Please Workflow:**

1. **Development**: Push conventional commits to main
2. **Release PR**: Release Please creates PR with version bump & changelog
3. **Merge**: Merge release PR to create tag
4. **Release**: CI/CD builds and creates GitHub Release with artifacts

This ensures:
- ✅ Semantic versioning based on commit types
- ✅ Auto-generated changelogs
- ✅ Only tested code gets released
- ✅ Artifacts match release version
- ✅ No manual version management

For detailed information, see [Release Process](./RELEASE_PROCESS.md).

## Setup Requirements

### 1. Enable GitHub Actions Permissions

Before Release Please can create release PRs:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**:
   - Select **Read and write permissions**
   - Enable **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

### 2. Enable GitHub Pages

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

### Current Performance (After Refactoring)

- **Dependencies**: Installed once per workflow with optimized hash-based caching (~10 seconds on cache miss, ~2 seconds on cache hit)
- **Vue Builds**: Built efficiently in single job (web + Electron)
- **Parallel Execution**: Lint/format and tests run in parallel
- **Cache Hit Rate**: >80% on subsequent runs (package-lock.json changes infrequently)
- **Total Time**: ~4-6 minutes for full pipeline (reduced from ~6-8 minutes)

### Key Optimizations Implemented

1. **Single Dependency Installation**: Dependencies installed once in `setup-build` job
2. **Optimized Caching**: Hash-based cache keys using `package-lock.json` for reliability
3. **Parallel Quality Checks**: Lint/format runs in parallel with tests
4. **Build Consolidation**: Both web and Electron builds in single `build-apps` job
5. **Artifact Reuse**: Platform builds download pre-built Vue apps

### Future Optimization Opportunities

1. **Split workflow** for PR vs main branch (PRs don't need builds)
2. **Cache Electron binaries** (saves 2-3 minutes on platform builds)
3. **Add Vue build cache** for faster incremental builds

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
