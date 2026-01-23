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
// Note: GUIDs are stable identifiers for each web resource in D365
const WEB_RESOURCES = {
  // Core library files
  'ui-lib.min.js': 'err403_ui-libminjs7A3C73EA-4CBF-F011-BBD3-000D3ACBC2CC',
  'ui-lib.types.d.ts.js': 'err403_ui-libtypesdts65EFD173-CBC0-F011-BBD3-000D3ACBC2CC',
  'ui-lib.styles.css': 'err403_ui-libstylescssB3919FB9-CCC0-F011-BBD3-000D3ACBC2CC',

  // HTML pages (new single page approach)
  'about.html': 'err403_abouthtmlC4BBB1CB-0CF7-F011-8406-00224810270E',
  'README.md.html': 'err403_READMEmd060D1286-CBC0-F011-BBD3-000D3ACBC2CC',

  // Page assets (React/Fluent UI compiled pages - single bundle)
  'assets/page-about.js': 'err403_assetspage-aboutjs3AE8C14D-0DF7-F011-8406-00224810270E',
  'assets/page-styles.css': 'err403_assetspage-stylescssA1B2C3D4-0005-F011-BBD3-000D3ACBC2CC'
};

// D365 web resource name mappings for HTML path transformations
const D365_WEB_RESOURCE_NAMES = {
  'ui-lib.min.js': 'err403_/ui-lib.min.js',
  'ui-lib.styles.css': 'err403_/ui-lib.styles.css',
  './assets/page-about.js': 'err403_/assets/page-about.js',
  './assets/page-styles.css': 'err403_/assets/page-styles.css'
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
 * Get solution unique name from solution.xml
 */
function getSolutionName() {
  const solutionXml = fs.readFileSync(SOLUTION_FILE, 'utf8');
  const match = solutionXml.match(/<UniqueName>([^<]+)<\/UniqueName>/);
  return match ? match[1] : 'solution';
}

/**
 * Transform HTML content for D365 web resources
 * Converts local paths to relative paths for web resources
 */
function transformHtmlForD365(content) {
  // For HTML web resources, use relative paths (not $webresource:)
  // The HTML is served as a web resource, so relative paths work correctly
  return content;
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

    // For HTML files, transform paths for D365
    if (sourceFile.endsWith('.html')) {
      let content = fs.readFileSync(sourcePath, 'utf8');
      content = transformHtmlForD365(content);
      fs.writeFileSync(targetPath, content, 'utf8');
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }

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
  const name = getSolutionName();

  // Copy web resources
  copyWebResources();

  console.log('\n✨ Solution updated successfully!');
  console.log(`📋 Next steps:`);
  console.log(`   1. Run: npm run pack-solution`);
  console.log(`   2. Import unmanaged: solution/${name}_${version.replace(/\./g, '_')}_unmanaged.zip`);
  console.log(`   3. Import managed: solution/${name}_${version.replace(/\./g, '_')}_managed.zip`);
}

main();
