#!/usr/bin/env node

/**
 * Packs the Dataverse solution as a ZIP file (simple approach)
 * Use this if PAC CLI has issues
 */

const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const SOLUTION_SRC = path.join(__dirname, '../solution/src');
const SOLUTION_OUTPUT = path.join(__dirname, '../solution');
const SOLUTION_XML = path.join(SOLUTION_SRC, 'solution.xml');

/**
 * Get solution version from solution.xml
 */
function getSolutionVersion() {
  const solutionXml = fs.readFileSync(SOLUTION_XML, 'utf8');
  const match = solutionXml.match(/<Version>([\d.]+)<\/Version>/);
  return match ? match[1] : 'unknown';
}

/**
 * Get solution unique name from solution.xml
 */
function getSolutionName() {
  const solutionXml = fs.readFileSync(SOLUTION_XML, 'utf8');
  const match = solutionXml.match(/<UniqueName>([^<]+)<\/UniqueName>/);
  return match ? match[1] : 'solution';
}

/**
 * Zip the solution folder
 */
function zipSolution() {
  const version = getSolutionVersion();
  const name = getSolutionName();
  const outputFile = path.resolve(SOLUTION_OUTPUT, `${name}_${version.replace(/\./g, '_')}_managed.zip`);

  console.log('📦 Zipping solution...');
  console.log(`   Solution: ${name}`);
  console.log(`   Version: ${version}`);
  console.log(`   Output: ${outputFile}\n`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const stats = fs.statSync(outputFile);
      console.log(`\n✅ Solution zipped successfully!`);
      console.log(`   File: ${outputFile}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Total bytes: ${archive.pointer()}`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error('\n❌ Failed to zip solution:', err);
      reject(err);
    });

    archive.pipe(output);

    // Add solution.xml and [Content_Types].xml at root
    archive.file(path.join(SOLUTION_SRC, 'solution.xml'), { name: 'solution.xml' });
    archive.file(path.join(SOLUTION_SRC, '[Content_Types].xml'), { name: '[Content_Types].xml' });
    
    // Add customizations.xml from Other folder to root
    archive.file(path.join(SOLUTION_SRC, 'Other', 'Customizations.xml'), { name: 'customizations.xml' });
    
    // Add WebResources folder
    archive.directory(path.join(SOLUTION_SRC, 'WebResources'), 'WebResources');

    archive.finalize();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Packing Dataverse solution (ZIP method)...\n');

  // Check if solution source exists
  if (!fs.existsSync(SOLUTION_SRC)) {
    console.error('❌ Error: Solution source directory not found at:', SOLUTION_SRC);
    process.exit(1);
  }

  try {
    await zipSolution();
  } catch (error) {
    console.error('❌ Failed to pack solution');
    process.exit(1);
  }
}

main();
