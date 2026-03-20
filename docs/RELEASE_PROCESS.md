# Release Process

This project uses **Release Please** for automated version management with **manual releases as a fallback**.

## Quick Reference

| Method | When to Use | Command |
|--------|-------------|---------|
| **Automated** | Normal releases with conventional commits | Just push with `feat:`, `fix:` commits |
| **Manual** | Emergency hotfixes or when automation fails | `npm run release:patch` |

## Method 1: Automated Release (Primary)

### When to Use
- Normal development with multiple commits
- Feature releases or bug fixes
- Regular version updates

### How It Works

1. **Make commits with conventional format:**
   ```bash
   # Feature
   git commit -m "feat: add new AI provider support"

   # Bug fix
   git commit -m "fix: resolve memory leak in transcription"

   # Documentation
   git commit -m "docs: update installation guide"
   ```

2. **Push to main:**
   ```bash
   git push origin main
   ```

3. **Release Please creates a Release PR:**
   - Automatically analyzes commits
   - Creates PR titled: `chore(main): release your-assistant X.Y.Z`
   - Includes bumped version and auto-generated changelog
   - Updates package.json, CHANGELOG.md, and manifest

4. **Review and merge the Release PR:**
   - Check the changelog looks correct
   - Merge when ready

5. **CI/CD automatically:**
   - Release Please creates GitHub Release with changelog
   - CI/CD builds all platforms (macOS, Windows, Linux)
   - CI/CD uploads platform installers to the release

### Conventional Commit Types

| Type | Description | Bump | Example |
|------|-------------|------|---------|
| `feat` | New feature | Patch | `feat: add screenshot support` |
| `fix` | Bug fix | Patch | `fix: resolve memory leak` |
| `feat!` | Breaking feature | Major | `feat!: remove deprecated API` |
| `fix!` | Breaking fix | Minor | `fix!: change config schema` |
| `docs` | Documentation | None | `docs: update README` |
| `chore` | Maintenance | None | `chore: update dependencies` |
| `style` | Code style | None | `style: format code` |
| `refactor` | Refactoring | None | `refactor: simplify auth logic` |
| `perf` | Performance | None | `perf: optimize queries` |
| `test` | Tests | None | `test: add unit tests` |
| `build` | Build system | None | `build: update webpack config` |
| `ci` | CI/CD | None | `ci: fix workflow` |

## Method 2: Manual Release (Fallback)

### When to Use
- Emergency hotfixes that need immediate release
- Single-commit releases that don't trigger automation
- Release Please is not working
- Testing specific versions

### How It Works

1. **Make your changes:**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **Create release using npm script:**
   ```bash
   # Patch release (0.1.0 → 0.1.1)
   npm run release:patch

   # Minor release (0.1.0 → 0.2.0)
   npm run release:minor

   # Major release (0.1.0 → 1.0.0)
   npm run release:major
   ```

   This script:
   - Runs `npm version` to bump package.json
   - Updates Release Please manifest
   - Creates git commit with changes
   - Creates and pushes git tag

3. **CI/CD automatically:**
   - Detects new tag
   - Builds all platforms
   - Creates GitHub Release with artifacts

### Manual Release (Alternative)

If you prefer manual control:

```bash
# Update version
npm version patch  # or minor, or major

# Push commit and tag
git push origin main --tags
```

## Release Artifacts

All releases include:

### macOS
- `Your Assistant-X.Y.Z-arm64.dmg` - Disk image installer
- `Your Assistant-X.Y.Z-arm64-mac.zip` - ZIP archive
- SHA256 checksums

### Windows
- `Your Assistant-Setup X.Y.Z.exe` - NSIS installer
- `Your Assistant-X.Y.Z-win.zip` - Portable ZIP archive

### Linux
- `Your-Assistant-X.Y.Z.AppImage` - Universal AppImage
- `your-assistant_X.Y.Z_amd64.deb` - Debian package

## Setup Requirements

### GitHub Actions Permissions

Release Please needs write permissions:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

### Configuration Files

- **`.github/release-please-config.json`** - Release Please configuration
- **`.github/release-please-manifest.json`** - Tracks release state (auto-maintained)
- **`.github/workflows/release-please.yml`** - Automation workflow
- **`.github/workflows/ci.yml`** - CI/CD pipeline (builds releases)

## Checking Release Status

1. **Release PRs**: https://github.com/gma/your-assistant/pulls
2. **Releases**: https://github.com/gma/your-assistant/releases
3. **Workflow Runs**: https://github.com/gma/your-assistant/actions

## Best Practices

1. **Use Conventional Commits:**
   ```bash
   ✅ Good: "feat: add dark mode"
   ✅ Good: "fix: resolve memory leak"
   ❌ Bad: "update stuff"
   ```

2. **Merge Release PRs Promptly:** Don't let release PRs pile up

3. **Test Before Releasing:** Ensure CI/CD passes before merging Release PR

4. **Review Changelogs:** Release PR includes auto-generated changelog - review it!

5. **Breaking Changes:** Use `!` suffix for breaking changes
   ```bash
   feat!: remove old API
   ```

6. **Use Manual Releases for Emergencies:** Hotfixes can use `npm run release:patch`

## Troubleshooting

### Release PR Not Created

**Cause**: No conventional commits since last release

**Solution**: Make commits with conventional types (feat, fix, etc.)

### Wrong Version Bump

**Cause**: Commit type doesn't match expected bump

**Solution**: Use `feat!` or `fix!` for major/minor bumps

### Manual Release Failed

**Cause**: Git working directory not clean

**Solution**: Commit or stash changes first, then run release script

### Release Failed

**Cause**: CI/CD tests or builds failed

**Solution**: Check Actions tab for error logs, fix issues, then retry

## Links

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
