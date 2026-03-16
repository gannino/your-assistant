# Semantic Release Workflow

This project uses **semantic-release** for automated versioning and changelog generation.

## How It Works

### Automatic Release Process

1. **Push to main branch** → Triggers `release.yml` workflow
2. **semantic-release analyzes commits** → Determines next version (major/minor/patch)
3. **Creates git tag** (e.g., `v0.2.0`) → Triggers `build-electron.yml`
4. **Builds all platforms** → Uploads artifacts to GitHub Release
5. **Generates changelog** → Updates CHANGELOG.md

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types that trigger releases:**
- `feat:` → **Minor version** (0.1.0 → 0.2.0)
- `fix:` → **Patch version** (0.1.0 → 0.1.1)
- `perf:` → **Patch version**
- `refactor:` → **Patch version**

**Types that DON'T trigger releases:**
- `docs:` → Documentation only
- `style:` → Code style changes
- `chore:` → Maintenance tasks
- `test:` → Test updates
- `build:` → Build system changes

**Examples:**

```bash
# Feature → 0.1.0 → 0.2.0
git commit -m "feat: add dark mode support"

# Bug fix → 0.1.0 → 0.1.1
git commit -m "fix: resolve memory leak in transcription"

# Breaking change → 0.1.0 → 1.0.0
git commit -m "feat: redesign API architecture

BREAKING CHANGE: The new API is not backward compatible"

# No release
git commit -m "docs: update README installation instructions"
```

## Release Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Developer pushes commits to main branch                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  release.yml workflow runs                                  │
│  - Runs tests                                               │
│  - Analyzes commits with semantic-release                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  semantic-release determines version bump                   │
│  - feat: → minor (0.1.0 → 0.2.0)                            │
│  - fix: → patch (0.1.0 → 0.1.1)                             │
│  - BREAKING CHANGE: → major (0.1.0 → 1.0.0)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Creates git tag (e.g., v0.2.0)                             │
│  - Generates changelog from commits                        │
│  - Updates CHANGELOG.md                                     │
│  - Pushes tag to GitHub                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Tag triggers build-electron.yml                            │
│  - Builds macOS (DMG, ZIP)                                  │
│  - Builds Windows (EXE, Portable ZIP)                       │
│  - Builds Linux (AppImage, DEB)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Uploads artifacts to GitHub Release                        │
│  - All build files attached to release                      │
│  - Checksums included                                       │
│  - Release notes auto-generated                            │
└─────────────────────────────────────────────────────────────┘
```

## Manual Release Creation

If you need to create a release manually without pushing to main:

```bash
# Create and push a tag manually
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the build-electron.yml workflow and create the release.

## Skipping CI in Release Commits

The semantic-release commits automatically include `[skip ci]` to avoid CI loops:

```
chore(release): 0.2.0 [skip ci]

✨ Features
- add dark mode support

🐛 Bug Fixes
- resolve memory leak in transcription
```

## Changelog Generation

The CHANGELOG.md file is automatically maintained by semantic-release:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0](../compare/v0.1.0...v0.2.0) (2026-03-16)

### ✨ Features
- **ai:** add OpenRouter provider support ([abc123](../commit/abc123))
- add vision support for Gemini provider ([def456](../commit/def456))

### 🐛 Bug Fixes
- resolve electron build checksum errors ([ghi789](../commit/ghi789))

### 📝 Documentation
- update installation guide for new release ([jkl012](../commit/jkl012))
```

## Troubleshooting

### Release not created

**Check:**
1. Did you use conventional commit format?
2. Is the commit type `feat:`, `fix:`, `perf:`, or `refactor:`?
3. Did tests pass? (Release workflow requires passing tests)

**Debug:**
```bash
# Check release workflow logs
gh run list --workflow=release.yml

# View specific run
gh run view <run-id>
```

### Build artifacts not uploaded

**Check:**
1. Was a git tag created? (Check tags page)
2. Did build-electron.yml workflow run?
3. Check build logs for errors

**Debug:**
```bash
# List tags
git tag

# Check build workflow
gh run list --workflow=build-electron.yml
```

### Wrong version number

**Check:**
1. Review commit messages since last release
2. Highest priority wins: BREAKING > major > feat: > minor > fix: > patch

**Force version:**
```bash
# Manually create specific version tag
git tag v1.0.0
git push origin v1.0.0
```

## Best Practices

1. **Write clear commit messages**
   ```bash
   # Good
   git commit -m "feat: add screenshot capture for auto-mode"

   # Bad
   git commit -m "update stuff"
   ```

2. **Group related changes**
   ```bash
   # Make one feature commit instead of multiple small ones
   git add .
   git commit -m "feat: implement dark mode with user preferences"
   ```

3. **Use commit scopes for organization**
   ```bash
   git commit -m "feat(ai): add OpenRouter provider"
   git commit -m "fix(transcription): resolve Web Speech API timeout"
   ```

4. **Add breaking change notices**
   ```bash
   git commit -m "feat(api): redesign provider interface

   BREAKING CHANGE: Provider methods now require async initialization"
   ```

5. **Test before pushing**
   ```bash
   # Run tests locally first
   npm run test:ci
   npm run lint:check
   ```

## CI/CD Workflows Summary

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `test.yml` | Push to main/master, PRs | Run lint, format checks, and tests |
| `release.yml` | Push to main/master | Run semantic-release, create version tags |
| `build-electron.yml` | Git tags (v\*) | Build all platforms, upload to releases |

## Examples

### Example 1: Feature Release

```bash
# 1. Make feature commits
git add .
git commit -m "feat: add screenshot capture for auto-mode"
git commit -m "feat(ai): add vision support to all providers"
git commit -m "docs: update screenshot documentation"

# 2. Push to main
git push origin main

# Result: Creates v0.2.0 release with macOS, Windows, Linux builds
```

### Example 2: Bug Fix Release

```bash
# 1. Fix bug
git add .
git commit -m "fix: resolve transcription timeout on iOS"
git commit -m "chore: update timeout configuration"

# 2. Push to main
git push origin main

# Result: Creates v0.1.1 patch release
```

### Example 3: Breaking Change Release

```bash
# 1. Make breaking change
git add .
git commit -m "feat: redesign configuration system

BREAKING CHANGE: Configuration keys renamed from snake_case to camelCase"

# 2. Push to main
git push origin main

# Result: Creates v1.0.0 major release
```

## Resources

- [Semantic Release Documentation](https://github.com/semantic-release/semantic-release)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Angular Commit Convention](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#commit)
