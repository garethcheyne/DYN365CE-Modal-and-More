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
function zipSolution(managed = false) {
  const version = getSolutionVersion();
  const name = getSolutionName();
  const packageType = managed ? 'managed' : 'unmanaged';
  const outputFile = path.resolve(SOLUTION_OUTPUT, `${name}_${version.replace(/\./g, '_')}_${packageType}.zip`);

  console.log(`📦 Zipping ${packageType} solution...`);
  console.log(`   Solution: ${name}`);
  console.log(`   Version: ${version}`);
  console.log(`   Type: ${packageType}`);
  console.log(`   Output: ${outputFile}\n`);

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const stats = fs.statSync(outputFile);
      console.log(`✅ ${packageType.charAt(0).toUpperCase() + packageType.slice(1)} solution zipped successfully!`);
      console.log(`   File: ${outputFile}`);
      console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Total bytes: ${archive.pointer()}\n`);
      resolve();
    });

    archive.on('error', (err) => {
      console.error(`\n❌ Failed to zip ${packageType} solution:`, err);
      reject(err);
    });

    archive.pipe(output);

    // Read and modify solution.xml based on managed/unmanaged
    let solutionXml = fs.readFileSync(path.join(SOLUTION_SRC, 'solution.xml'), 'utf8');
    solutionXml = solutionXml.replace(/<Managed>\d<\/Managed>/, `<Managed>${managed ? '1' : '0'}</Managed>`);
    
    // Add modified solution.xml
    archive.append(solutionXml, { name: 'solution.xml' });
    
    // Add [Content_Types].xml at root
    archive.file(path.join(SOLUTION_SRC, '[Content_Types].xml'), { name: '[Content_Types].xml' });
    
    // Add customizations.xml at root
    archive.file(path.join(SOLUTION_SRC, 'customizations.xml'), { name: 'customizations.xml' });
    
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
    // Create both managed and unmanaged versions
    await zipSolution(false); // Unmanaged
    await zipSolution(true);  // Managed
    
    console.log('✨ Both solution packages created successfully!');
  } catch (error) {
    console.error('❌ Failed to pack solution');
    process.exit(1);
  }
}

main();
