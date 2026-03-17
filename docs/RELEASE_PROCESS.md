# Release Process with Release Please

This project uses **Release Please**, Google's industry-standard automated release management solution.

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

### Automatic

Release Please automatically creates release PRs when it detects conventional commits. No manual action needed!

### Manual Trigger

You can also trigger manually:

1. **Via GitHub Actions**:
   - Go to Actions → Release Please
   - Click "Run workflow"
   - Click "Run workflow" button

2. **Via commit**:
   ```bash
   git commit -m "chore: trigger release"
   git push
   ```

Then look for the Release PR created by Release Please.

## Example Workflow

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
