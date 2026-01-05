# Versioning Strategy

## Overview

BatchVideo uses **semantic versioning** (semver) with `package.json` as the single source of truth.

**Format:** `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backward-compatible
- **PATCH**: Bug fixes, backward-compatible

---

## Single Source of Truth

**`apps/desktop/package.json`** contains the version.

- Electron reads this via `app.getVersion()`
- Git tags must match this version
- GitHub release workflow triggered by matching git tag

---

## Release Workflow

### 1. Update Version

```bash
# From repo root
cd apps/desktop

# Bump version (choose one)
pnpm version patch   # 0.0.1 → 0.0.2
pnpm version minor   # 0.0.1 → 0.1.0
pnpm version major   # 0.0.1 → 1.0.0
```

This updates `package.json` and creates a git commit.

### 2. Create Matching Git Tag

```bash
# Get the version from package.json
VERSION=$(node -p "require('./apps/desktop/package.json').version")

# Create and push tag
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"
```

### 3. GitHub Actions Triggers

When you push a tag matching `v*.*.*`:
- `.github/workflows/release-desktop.yml` runs
- Builds macOS app (arm64 + x64)
- Creates GitHub Release
- Uploads DMG, ZIP, and auto-update files (.yml, .blockmap)

### 4. Auto-Update

electron-updater checks GitHub Releases for new versions:
- Compares `package.json` version with latest release
- Downloads silently if newer version found
- Installs on next app restart

---

## Quick Release Script (Optional)

Create `scripts/release.sh`:

```bash
#!/bin/bash
set -e

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./apps/desktop/package.json').version")
echo "Current version: $CURRENT_VERSION"

# Ask for bump type
echo "Bump type? (patch/minor/major)"
read BUMP_TYPE

# Bump version
cd apps/desktop
pnpm version $BUMP_TYPE --no-git-tag-version
cd ../..

# Get new version
NEW_VERSION=$(node -p "require('./apps/desktop/package.json').version")
echo "New version: $NEW_VERSION"

# Commit, tag, and push
git add apps/desktop/package.json
git commit -m "chore: bump version to v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "Ready to push. Run:"
echo "  git push origin master"
echo "  git push origin v$NEW_VERSION"
```

Make executable:
```bash
chmod +x scripts/release.sh
```

---

## Version Display

The app shows the version in:
- **Desktop app footer**: `v0.0.1` (from `app.getVersion()`)
- **App menu → About**: Built-in Electron dialog
- **Update notifications**: When new version available

---

## Troubleshooting

### Tag doesn't match package.json

**Problem:** Released v0.0.2 but package.json still says 0.0.1

**Fix:**
```bash
# Delete wrong tag
git tag -d v0.0.2
git push origin :refs/tags/v0.0.2

# Update package.json
cd apps/desktop && pnpm version 0.0.2 --no-git-tag-version

# Create correct tag
git add apps/desktop/package.json
git commit -m "chore: bump version to v0.0.2"
git tag -a v0.0.2 -m "Release v0.0.2"
git push origin master
git push origin v0.0.2
```

### Auto-update not working

Check:
1. Is app packaged? (Auto-update disabled in dev mode)
2. Is `publish` config in `electron-builder.json`?
3. Are `.yml` files uploaded to GitHub Release?
4. Check logs: macOS at `~/Library/Logs/BatchVideo/main.log`

---

## Current Version

Check current version:
```bash
node -p "require('./apps/desktop/package.json').version"
```

Check latest tag:
```bash
git describe --tags --abbrev=0
```

Verify they match:
```bash
VERSION=$(node -p "require('./apps/desktop/package.json').version")
TAG=$(git describe --tags --abbrev=0 | sed 's/^v//')
if [ "$VERSION" = "$TAG" ]; then
  echo "✓ Version and tag match: $VERSION"
else
  echo "✗ Mismatch! Version: $VERSION, Tag: $TAG"
fi
```
