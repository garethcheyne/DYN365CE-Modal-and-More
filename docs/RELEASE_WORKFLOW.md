# Release Workflow Guide

This document explains the automated release process for the err403 D365 UI Library.

## Overview

The project uses GitHub Actions to automatically build and create releases when code is pushed to the main branch.

## Automated Release Process

### Trigger Events

The workflow automatically runs when:
1. **Version tags** - Pushing tags like `v2026.01.26.01` triggers the release (use `npm run git:release`)
2. **Manual trigger** - Can be manually run from GitHub Actions UI

**Note:** The workflow does NOT trigger on regular commits to main/master. Only version tags trigger releases.

### What Happens Automatically

When you push a version tag, GitHub Actions will:

1. ✅ Checkout the code
2. ✅ Install dependencies
3. ✅ Build the library (`npm run build`)
4. ✅ Build demo pages
5. ✅ Update solution web resources
6. ✅ Package the D365 solution ZIP
7. ✅ Read version from `package.json`
8. ✅ Create a GitHub release with:
   - D365 solution package (`.zip`)
   - Library bundle (`ui-lib.min.js`)
   - Source map (`ui-lib.min.js.map`)
   - TypeScript definitions (`ui-lib.types.d.ts`)
   - README documentation
9. ✅ Upload build artifacts (retained for 90 days)

## Version Management

### Version Format

Versions follow the format: `YYYY.MM.DD.NN`

- `YYYY` - Year (4 digits)
- `MM` - Month (2 digits, zero-padded)
- `DD` - Day (2 digits, zero-padded)
- `NN` - Build number (2 digits, zero-padded)

**Examples:**
- `2026.01.24.01` - First build on January 24, 2026
- `2026.01.24.02` - Second build on same day
- `2026.02.01.01` - First build on February 1, 2026

### Bumping Versions

Use the version bump script to automatically update the version:

```bash
npm run version:bump
```

This will:
- If same day: Increment build number (`.01` → `.02` → `.03`)
- If new day: Create new version with build `.01`
- Update `package.json` automatically

### Manual Version Update

You can also manually edit `package.json`:

```json
{
  "version": "2026.01.24.02"
}
```

## Release Workflow

### Standard Release Process

1. **Make your changes** and test locally:
   ```bash
   npm run dev     # Test in browser
   npm run test    # Run tests
   npm run demo    # View demo page
   ```

2. **Bump the version** (optional, for significant releases):
   ```bash
   npm run version:bump
   ```

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to main**:
   ```bash
   git push origin main
   ```

5. **GitHub Actions automatically**:
   - Builds the project
   - Creates a release with the current version from `package.json`
   - Uploads all assets

6. **Check the release**:
   - Go to: https://github.com/[your-org]/[your-repo]/releases
   - Verify the new release is created
   - Download and test the solution package

### Hotfix Release (Same Day)

If you need multiple releases on the same day:

1. Make your fix
2. Run `npm run version:bump` - automatically increments build number
3. Commit: `git commit -m "fix: critical bug"`
4. Push: `git push origin main`

### Tagged Release (Manual)

For specific version tagging:

1. Update version in `package.json`
2. Commit changes
3. Create and push tag:
   ```bash
   git tag v2026.01.24.01
   git push origin v2026.01.24.01
   ```

## Release Notes

Release notes are automatically generated and include:

- **Version number** from `package.json`
- **Installation instructions**
- **What's included** (files in release)
- **Feature highlights**
- **Commit message** from the push
- **Automatically generated changelog** from commits

You can edit release notes after creation on GitHub.

## Build Artifacts

Every build uploads artifacts retained for 90 days:
- Complete `build/` directory
- Solution package ZIP
- Accessible from GitHub Actions run page

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs: `.github/workflows/release.yml`
2. Verify build works locally: `npm run release`
3. Check for errors in scripts: `scripts/update-solution.js`, `scripts/pack-solution-zip.js`

### Release Not Created

1. Verify you pushed to `main` or `master` branch
2. Check GitHub Actions permissions in repository settings
3. Verify `GITHUB_TOKEN` has write permissions

### Wrong Version in Release

1. Ensure `package.json` version is correct
2. Run `npm run version:bump` before pushing
3. Commit the version change

## Best Practices

1. **Test locally first** - Always run `npm run release` locally before pushing
2. **Meaningful commits** - Write clear commit messages (they appear in release notes)
3. **Version on significant changes** - Bump version for features, not every commit
4. **Review releases** - Check GitHub releases page after push
5. **Document changes** - Update README.md when adding features

## Commit Message Conventions

Use conventional commits for better release notes:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, styling
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add conditional field visibility"
git commit -m "fix: resolve wizard navigation bug"
git commit -m "docs: update API reference"
```

## Manual Release Steps (If Needed)

If you need to manually create a release:

1. Build locally:
   ```bash
   npm run release
   ```

2. Go to GitHub: `https://github.com/[org]/[repo]/releases/new`

3. Fill in:
   - Tag: `v2026.01.24.01`
   - Title: `Release v2026.01.24.01`
   - Description: Release notes
   - Files: Upload from `build/` and `solution/`

4. Click "Publish release"

## CI/CD Configuration

The workflow file is located at: `.github/workflows/release.yml`

Key configuration:
- **Runs on**: Ubuntu latest
- **Node version**: 20
- **Cache**: npm dependencies
- **Artifacts retention**: 90 days
- **Release draft**: false (published immediately)
- **Pre-release**: false (marked as stable)

## Related Documentation

- [Solution Workflow](SOLUTION_WORKFLOW.md) - D365 solution packaging details
- [Testing Guide](TESTING.md) - How to test the library
- [README.md](README.md) - Complete API documentation
- [AI Guide](.github/copilot-instructions.md) - Guide for AI agents
