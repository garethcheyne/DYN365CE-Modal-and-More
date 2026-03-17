---
title: Release Workflow
description: Automated release process using GitHub Actions and version management
author: gareth-cheyne
category: dynamics-365-ce
---

# Release Workflow

The project uses GitHub Actions to automatically build and create releases when version tags are pushed.

## Automated Release Process

### Trigger Events

The workflow runs when:

1. **Version tags** — Pushing tags like `v2026.01.26.01` triggers the release (use `npm run git:release`)
2. **Manual trigger** — Can be run manually from the GitHub Actions UI

> The workflow does **not** trigger on regular commits to main. Only version tags trigger releases.

### What Happens Automatically

When you push a version tag, GitHub Actions will:

1. Checkout the code
2. Install dependencies
3. Build the library (`npm run build`)
4. Build demo pages
5. Update solution web resources
6. Package the D365 solution ZIP
7. Read version from `package.json`
8. Create a GitHub release with:
   - D365 solution package (`.zip`)
   - Library bundle (`ui-lib.min.js`)
   - Source map (`ui-lib.min.js.map`)
   - TypeScript definitions (`ui-lib.types.d.ts`)
   - README documentation
9. Upload build artifacts (retained for 90 days)

## Version Management

### Version Format

Versions follow `YYYY.MM.DD.NN`:

| Part | Description |
|------|-------------|
| `YYYY` | Year (4 digits) |
| `MM` | Month (2 digits, zero-padded) |
| `DD` | Day (2 digits, zero-padded) |
| `NN` | Build number (2 digits, zero-padded) |

**Examples:** `2026.01.24.01` (first build), `2026.01.24.02` (second build same day)

### Bumping Versions

```bash
npm run version:bump
```

- **Same day**: Increments build number (`.01` → `.02` → `.03`)
- **New day**: Creates new version with build `.01`
- Updates `package.json` automatically

## Standard Release Process

1. **Make changes** and test locally:

   ```bash
   npm run dev     # Test in browser
   npm run demo    # View demo page
   ```

2. **Bump the version:**

   ```bash
   npm run version:bump
   ```

3. **Commit changes:**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to main:**

   ```bash
   git push origin main
   ```

5. **GitHub Actions** builds and creates the release automatically.

6. **Verify** at `https://github.com/[org]/[repo]/releases`

## Hotfix Release (Same Day)

```bash
# Fix the issue
npm run version:bump    # Increments build number
git commit -m "fix: critical bug"
git push origin main
```

## Tagged Release (Manual)

```bash
# Update version in package.json
git commit -m "chore: release v2026.01.24.01"
git tag v2026.01.24.01
git push origin v2026.01.24.01
```

## Commit Message Conventions

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, styling |
| `refactor:` | Code restructuring |
| `test:` | Adding tests |
| `chore:` | Maintenance tasks |

## Troubleshooting

### Build Fails

1. Check GitHub Actions logs
2. Verify build works locally: `npm run release`
3. Check scripts in `scripts/` directory

### Release Not Created

1. Verify you pushed to `main` or `master` branch
2. Check GitHub Actions permissions
3. Verify `GITHUB_TOKEN` has write permissions

### Wrong Version

1. Ensure `package.json` version is correct
2. Run `npm run version:bump` before pushing
3. Commit the version change
