# Dataverse Solution Workflow

This guide explains how to build and deploy the err403 UI Library solution to Dynamics 365.

## Quick Start

### 1. Build Everything and Create Solution
```bash
npm run release
```

This single command will:
- ✅ Build the TypeScript library (`vite build`)
- ✅ Generate type declarations
- ✅ Copy files to `release/` folder
- ✅ Update web resources in `solution/src/WebResources/`
- ✅ Update solution version to current date/time
- ✅ Pack the solution into a `.zip` file

### 2. Import to Dynamics 365
1. Navigate to https://make.powerapps.com
2. Select your environment
3. Go to **Solutions** → **Import**
4. Upload the `.zip` file from `solution/` folder (e.g., `err403UILibrary_2025_11_14_1430_unmanaged.zip`)
5. Click **Next** → **Import**

## Individual Commands

### Build the Library
```bash
npm run build
```
Compiles TypeScript and creates `build/ui-lib.min.js`

### Update Solution Web Resources
```bash
npm run update-solution
```
- Copies files from `release/` to `solution/src/WebResources/`
- Updates solution version in `solution.xml`

### Pack Solution
```bash
npm run pack-solution
```
Creates a `.zip` file ready for import to D365

## Solution Structure

```
solution/
├── src/                          # Unpacked solution (source controlled)
│   ├── WebResources/             # Web resource files
│   │   ├── err403_ui-libminjs7A3C73EA-4CBF-F011-BBD3-000D3ACBC2CC
│   │   ├── err403_demohtmlFCA401DA-4CBF-F011-BBD3-000D3ACBC2CC
│   │   ├── err403_testshtml1207B2F8-4CBF-F011-BBD3-000D3ACBC2CC
│   │   └── ...
│   ├── solution.xml              # Solution manifest
│   ├── customizations.xml        # Customizations
│   └── [Content_Types].xml      # Content types
└── *.zip                         # Packed solutions (gitignored)
```

## Web Resources Mapping

| Release File | Solution File | Type |
|-------------|---------------|------|
| `ui-lib.min.js` | `err403_ui-libminjs...` | JavaScript |
| `ui-lib.types.d.ts.js` | `err403_ui-libtypesdts...` | JavaScript |
| `ui-lib.styles.css` | `err403_ui-libstylescss...` | CSS |
| `demo.html` | `err403_demohtml...` | HTML |
| `tests.html` | `err403_testshtml...` | HTML |
| `howto.html` | `err403_howtohtml...` | HTML |
| `README.md.html` | `err403_READMEmd...` | HTML |

## Version Management

The solution version is automatically updated to `YYYY.MM.DD.HHMM` format when running:
- `npm run update-solution`
- `npm run release`

Example: `2025.11.14.1430` = November 14, 2025 at 2:30 PM

## CI/CD Integration

### GitHub Actions (Automatic)
When you push to `main` branch:
1. GitHub Actions syncs to Azure DevOps `inGitHub` branch
2. Azure DevOps can run build/test pipelines
3. Create PR in Azure DevOps to merge to main

### Manual Workflow
1. Make changes in `src/`
2. Run `npm run release`
3. Commit changes to GitHub
4. Import solution to D365

## Requirements

- **Node.js** 18+ (for building)
- **Power Platform CLI** (auto-installed via `dotnet tool`)
- **.NET SDK** (required for PAC CLI)

### Installing .NET SDK
If you don't have .NET installed:
- **Windows**: https://dotnet.microsoft.com/download
- **macOS**: `brew install dotnet-sdk`
- **Linux**: https://docs.microsoft.com/dotnet/core/install/linux

## Troubleshooting

### PAC CLI not found
```bash
dotnet tool install --global Microsoft.PowerApps.CLI.Tool
```

### Solution pack fails
- Ensure all web resource files exist in `solution/src/WebResources/`
- Run `npm run build` first to generate release files
- Check that solution.xml is valid XML

### Version conflicts
- If import fails due to version, manually update version in `solution/src/solution.xml`
- Or delete the solution from D365 and import fresh

## Best Practices

1. ✅ Always run `npm run release` before committing solution changes
2. ✅ Don't manually edit files in `solution/src/WebResources/` (they'll be overwritten)
3. ✅ Source files go in `src/`, release artifacts go in `release/`
4. ✅ Commit the unpacked solution (`solution/src/`) to Git
5. ✅ Add `solution/*.zip` to `.gitignore` (packed solutions are build artifacts)
6. ✅ Use semantic versioning in `package.json` for npm releases
7. ✅ Use date-based versioning in `solution.xml` for D365 imports

## Useful Commands

```bash
# Development workflow
npm run dev              # Start dev server
npm run watch            # Auto-rebuild on changes
npm run demo             # View demo page

# Release workflow
npm run build            # Build library
npm run release          # Build + update solution + pack
npm run pack-solution    # Pack solution only

# Manual steps
node scripts/update-solution.js  # Update web resources
node scripts/pack-solution.js    # Pack to .zip
```
