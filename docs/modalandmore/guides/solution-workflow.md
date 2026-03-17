---
title: Solution Deployment
description: Build, package, and import the D365 solution
author: gareth-cheyne
category: dynamics-365-ce
---

# Solution Deployment

How to build and deploy the UI Library solution to Dynamics 365.

## Quick Start

### 1. Build Everything and Create Solution

```bash
npm run release
```

This single command will:

- Build the TypeScript library (`vite build`)
- Generate type declarations
- Copy files to `release/` folder
- Update web resources in `solution/src/WebResources/`
- Update solution version to current date/time
- Pack the solution into a `.zip` file

### 2. Import to Dynamics 365

1. Navigate to [make.powerapps.com](https://make.powerapps.com)
2. Select your environment
3. Go to **Solutions** → **Import**
4. Upload the `.zip` file from `solution/` folder
5. Click **Next** → **Import**

## Individual Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build library → `build/ui-lib.min.js` |
| `npm run update-solution` | Copy release files to solution, update version |
| `npm run pack-solution` | Pack solution to `.zip` |
| `npm run release` | All of the above in one step |

## Solution Structure

```
solution/
├── src/                          # Unpacked solution (source controlled)
│   ├── WebResources/             # Web resource files
│   ├── solution.xml              # Solution manifest
│   ├── customizations.xml        # Customizations
│   └── [Content_Types].xml       # Content types
└── *.zip                         # Packed solutions (gitignored)
```

## Web Resources Mapping

| Release File | Solution Web Resource | Type |
|-------------|----------------------|------|
| `ui-lib.min.js` | `err403_ui-libminjs...` | JavaScript |
| `ui-lib.types.d.ts.js` | `err403_ui-libtypesdts...` | JavaScript |
| `ui-lib.styles.css` | `err403_ui-libstylescss...` | CSS |
| `demo.html` | `err403_demohtml...` | HTML |
| `tests.html` | `err403_testshtml...` | HTML |
| `howto.html` | `err403_howtohtml...` | HTML |
| `README.md.html` | `err403_READMEmd...` | HTML |

## Version Management

The solution version is automatically set to `YYYY.MM.DD.HHMM` format when running `npm run update-solution` or `npm run release`.

Example: `2025.11.14.1430` = November 14, 2025 at 2:30 PM

## Requirements

- **Node.js** 18+
- **Power Platform CLI** (auto-installed via `dotnet tool`)
- **.NET SDK** (required for PAC CLI)

### Installing .NET SDK

| Platform | Command |
|----------|---------|
| Windows | [Download installer](https://dotnet.microsoft.com/download) |
| macOS | `brew install dotnet-sdk` |
| Linux | [See docs](https://docs.microsoft.com/dotnet/core/install/linux) |

### Installing PAC CLI

```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

## Best Practices

- Always run `npm run release` before committing solution changes
- Don't manually edit files in `solution/src/WebResources/` — they get overwritten
- Source files go in `src/`, release artifacts go in `release/`
- Commit the unpacked solution (`solution/src/`) to Git
- Add `solution/*.zip` to `.gitignore`

## Troubleshooting

### PAC CLI Not Found

```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### Solution Pack Fails

- Ensure all web resource files exist in `solution/src/WebResources/`
- Run `npm run build` first to generate release files
- Check that `solution.xml` is valid XML

### Version Conflicts

- If import fails due to version, manually update version in `solution/src/solution.xml`
- Or delete the solution from D365 and import fresh
