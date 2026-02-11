#!/usr/bin/env node

/**
 * Packs the Dataverse solution using PAC CLI
 */

const { execSync } = require('child_process');
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
 * Check if PAC CLI is installed
 */
function checkPacCli() {
  try {
    execSync('pac --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Install PAC CLI via dotnet tool
 */
function installPacCli() {
  console.debug('📦 Installing Power Platform CLI...');
  try {
    execSync('dotnet tool install --global Microsoft.PowerApps.CLI.Tool', { stdio: 'inherit' });
    console.debug('✅ PAC CLI installed successfully\n');
  } catch (error) {
    console.error('❌ Failed to install PAC CLI');
    console.debug('\nManual installation:');
    console.debug('   dotnet tool install --global Microsoft.PowerApps.CLI.Tool');
    process.exit(1);
  }
}

/**
 * Pack solution
 */
function packSolution() {
  const version = getSolutionVersion();
  const name = getSolutionName();
  const outputFile = path.resolve(SOLUTION_OUTPUT, `${name}_${version.replace(/\./g, '_')}_managed.zip`);
  const sourceFolder = path.resolve(SOLUTION_SRC);

  console.debug('📦 Packing solution...');
  console.debug(`   Solution: ${name}`);
  console.debug(`   Version: ${version}`);
  console.debug(`   Source: ${sourceFolder}`);
  console.debug(`   Output: ${outputFile}\n`);

  try {
    // Try using SolutionPackager from NuGet package instead of PAC CLI
    const command = `pac solution pack --zipfile "${outputFile}" --folder "${sourceFolder}" --packagetype Managed`;
    console.debug(`Command: ${command}\n`);
    execSync(command, { stdio: 'inherit' });
    
    const stats = fs.statSync(outputFile);
    console.debug(`\n✅ Solution packed successfully!`);
    console.debug(`   File: ${outputFile}`);
    console.debug(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  } catch (error) {
    console.error('\n❌ Failed to pack solution');
    process.exit(1);
  }
}

/**
 * Main execution
 */
function main() {
  console.debug('🚀 Packing Dataverse solution...\n');

  // Change to project root directory
  const projectRoot = path.join(__dirname, '..');
  process.chdir(projectRoot);
  console.debug(`Working directory: ${process.cwd()}\n`);

  // Check if solution source exists
  if (!fs.existsSync(SOLUTION_SRC)) {
    console.error('❌ Error: Solution source directory not found at:', SOLUTION_SRC);
    process.exit(1);
  }

  // Check if PAC CLI is installed
  if (!checkPacCli()) {
    console.debug('⚠️  PAC CLI not found');
    installPacCli();
  }

  // Pack solution
  packSolution();
}

main();
