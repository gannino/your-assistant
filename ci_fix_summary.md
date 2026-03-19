# CI/CD Fix Summary

## Issue
GitHub releases were being created but artifacts (DMG, EXE, AppImage, DEB) were not being attached.

## Root Cause
- Release Please creates tags like `your-assistant-v1.0.0`
- CI/CD release job only accepted tags like `v1.0.0`
- Result: Release job skipped, artifacts never built

## Solution
Updated CI/CD workflow to accept both tag formats:
```yaml
if: github.event_name == 'push' && (startsWith(github.ref, 'refs/tags/v') || startsWith(github.ref, 'refs/tags/your-assistant-v'))
```

## Files Changed
- `.github/workflows/ci.yml` - Line 342

## Testing
Waiting for release tag to verify artifacts are properly attached.
