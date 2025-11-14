#!/usr/bin/env node

/**
 * Updates Dataverse solution web resources with latest build artifacts
 */

const fs = require('fs');
const path = require('path');

// Paths
const RELEASE_DIR = path.join(__dirname, '../release');
const SOLUTION_WR_DIR = path.join(__dirname, '../solution/src/WebResources');
const SOLUTION_FILE = path.join(__dirname, '../solution/src/solution.xml');

// Web resource mapping (release file -> solution file)
const WEB_RESOURCES = {
  'ui-lib.min.js': 'err403_ui-libminjs7A3C73EA-4CBF-F011-BBD3-000D3ACBC2CC',
  'ui-lib.types.d.ts.js': 'err403_ui-libtypesdts65EFD173-CBC0-F011-BBD3-000D3ACBC2CC',
  'ui-lib.styles.css': 'err403_ui-libstylescssB3919FB9-CCC0-F011-BBD3-000D3ACBC2CC',
  'demo.html': 'err403_demohtmlFCA401DA-4CBF-F011-BBD3-000D3ACBC2CC',
  'tests.html': 'err403_testshtml1207B2F8-4CBF-F011-BBD3-000D3ACBC2CC',
  'howto.html': 'err403_howtohtmlA5B70C0B-CBC0-F011-BBD3-000D3ACBC2CC',
  'README.md.html': 'err403_READMEmd060D1286-CBC0-F011-BBD3-000D3ACBC2CC'
};

/**
 * Update solution version
 */
function updateSolutionVersion() {
  const now = new Date();
  const version = `${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}.${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  
  let solutionXml = fs.readFileSync(SOLUTION_FILE, 'utf8');
  solutionXml = solutionXml.replace(/<Version>[\d.]+<\/Version>/, `<Version>${version}</Version>`);
  fs.writeFileSync(SOLUTION_FILE, solutionXml, 'utf8');
  
  console.log(`✅ Updated solution version to: ${version}`);
  return version;
}

/**
 * Copy web resources from release to solution
 */
function copyWebResources() {
  let copiedCount = 0;
  let skippedCount = 0;

  for (const [sourceFile, targetFile] of Object.entries(WEB_RESOURCES)) {
    const sourcePath = path.join(RELEASE_DIR, sourceFile);
    const targetPath = path.join(SOLUTION_WR_DIR, targetFile);

    if (!fs.existsSync(sourcePath)) {
      console.log(`⚠️  Skipped: ${sourceFile} (not found in release)`);
      skippedCount++;
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
    const stats = fs.statSync(targetPath);
    console.log(`✅ Copied: ${sourceFile} → ${targetFile} (${(stats.size / 1024).toFixed(2)} KB)`);
    copiedCount++;
  }

  console.log(`\n📦 Web Resources: ${copiedCount} copied, ${skippedCount} skipped`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Updating Dataverse solution...\n');

  // Check if release directory exists
  if (!fs.existsSync(RELEASE_DIR)) {
    console.error('❌ Error: Release directory not found. Run "npm run build" first.');
    process.exit(1);
  }

  // Check if solution directory exists
  if (!fs.existsSync(SOLUTION_WR_DIR)) {
    console.error('❌ Error: Solution WebResources directory not found.');
    process.exit(1);
  }

  // Update version
  const version = updateSolutionVersion();

  // Copy web resources
  copyWebResources();

  console.log('\n✨ Solution updated successfully!');
  console.log(`📋 Next steps:`);
  console.log(`   1. Run: npm run pack-solution`);
  console.log(`   2. Import: solution/err403UILibrary_${version.replace(/\./g, '_')}_unmanaged.zip`);
}

main();
