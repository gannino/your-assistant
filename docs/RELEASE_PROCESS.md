# Release Process with Release Please

This project uses **Release Please**, Google's industry-standard automated release management solution.

## Setup Requirements

### Enable GitHub Actions Permissions

Before Release Please can create release PRs, you need to enable workflow permissions:

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Click **Save**

This is required for Release Please to automatically create release pull requests.

## How It Works

Release Please automates version management and releases based on your **conventional commits**:

```
feat:  → New feature      → Patch bump (1.0.3 → 1.0.4)
fix:   → Bug fix          → Patch bump (1.0.3 → 1.0.4)
feat!  → Breaking feature → Major bump (1.0.3 → 2.0.0)
fix!   → Breaking fix     → Minor bump (1.0.3 → 1.1.0)
```

## Release Workflow

### 1. Development Phase

Make commits with conventional commit format:

```bash
# Feature
git commit -m "feat: add new AI provider support"

# Bug fix
git commit -m "fix: resolve memory leak in transcription"

# Documentation
git commit -m "docs: update installation guide"

# Multiple changes
git commit -m "feat: add dark mode
fix: resolve UI glitches
docs: update README"
```

Push to main:
```bash
git push origin main
```

**Result**: CI/CD runs quality checks, tests, and builds. **No release created yet.**

### 2. Release Phase

When Release Please detects enough conventional commits, it automatically:

1. **Creates a Release PR** with:
   - Bumped version (e.g., 1.0.3 → 1.0.4)
   - Auto-generated changelog
   - Updated package.json

2. **Waits for you to merge** the Release PR

3. **On merge**:
   - Creates git tag (e.g., v1.0.4)
   - Triggers CI/CD to build and create GitHub Release
   - Uploads installer artifacts for all platforms

### 3. Release Created

GitHub Release includes:
- ✅ Version tag (v1.0.4)
- ✅ Auto-generated changelog
- ✅ macOS DMG + ZIP
- ✅ Windows EXE + ZIP
- ✅ Linux AppImage + DEB

## Conventional Commit Types

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

## Triggering a Release

### Method 1: Manual Tag Creation (Current Approach)

**Note**: Release Please automation is currently not working properly. Use this manual approach:

```bash
# 1. Make your changes with conventional commits
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. Update version in package.json
jq '.version = "0.4.0"' package.json > package.json.tmp && mv package.json.tmp package.json
git add package.json
git commit -m "chore: bump version to 0.4.0"
git push origin main

# 3. Create and push tag
git tag v0.4.0
git push origin v0.4.0

# 4. CI/CD automatically builds and creates release with artifacts
```

**Result**:

- Tag `v0.4.0` triggers CI/CD pipeline
- All platforms built (macOS, Windows, Linux)
- GitHub Release created with artifacts attached

### Method 2: Automatic (Release Please - Currently Disabled)

**Note**: This is the intended workflow but currently not functional. We're working to fix it.

When Release Please is working, it will:

1. Automatically create Release PRs when it detects conventional commits
2. Include bumped version and changelog in the PR
3. On merge, create tag and trigger CI/CD

### Manual Trigger via GitHub Actions

You can also manually trigger the Release Please workflow:

1. Go to **Actions** → **Release Please**
2. Click **"Run workflow"**
3. Click **"Run workflow"** button

Then look for the Release PR created by Release Please.

## Example Workflow

### Manual Release (Current Method)

```bash
# Make some changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Bump version
jq '.version = "0.4.0"' package.json > package.json.tmp && mv package.json.tmp package.json
git add package.json
git commit -m "chore: bump version to 0.4.0"
git push origin main

# Create tag to trigger release
git tag v0.4.0
git push origin v0.4.0

# CI/CD automatically:
# - Builds for all platforms
# - Creates GitHub Release with artifacts
```

### Automatic Release (Intended Method - Not Working)

```bash
# Make some changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Wait for Release Please to create Release PR
# PR will be titled like: "chore(main): release v1.0.4"

# Review the changelog in the PR
# Merge the Release PR when ready

# CI/CD automatically:
# - Creates tag v1.0.4
# - Builds for all platforms
# - Creates GitHub Release with artifacts
```

## Checking Release Status

1. **Release PRs**: Check [Pull Requests](https://github.com/gma/your-assistant/pulls)
2. **Releases**: Check [Releases](https://github.com/gma/your-assistant/releases)
3. **Workflow**: Check [Actions → Release Please](https://github.com/gma/your-assistant/actions/workflows/release-please.yml)

## Best Practices

1. **Use Conventional Commits**:
   ```bash
   ✅ Good: "feat: add dark mode"
   ✅ Good: "fix: resolve memory leak"
   ❌ Bad: "update stuff"
   ```

2. **Merge Release PRs Promptly**: Don't let release PRs pile up

3. **Test Before Releasing**: Ensure CI/CD passes before merging Release PR

4. **Review Changelogs**: Release PR includes auto-generated changelog - review it!

5. **Breaking Changes**: Use `!` suffix for breaking changes
   ```bash
   feat!: remove old API
   ```

## Troubleshooting

### Release PR Not Created

**Cause**: No conventional commits since last release

**Solution**: Make commits with conventional types (feat, fix, etc.)

### Wrong Version Bump

**Cause**: Commit type doesn't match expected bump

**Solution**: Use `feat!` or `fix!` for major/minor bumps

### Release Failed

**Cause**: CI/CD tests or builds failed

**Solution**: Check Actions tab for error logs, fix issues, then re-merge Release PR

## Links

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
