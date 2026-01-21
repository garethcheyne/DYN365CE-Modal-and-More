#!/usr/bin/env node

/**
 * PAC CLI Solution Deploy Script
 * Uses existing ZIP packager + PAC CLI for deployment to D365
 */

const { execSync, spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Copy .env.example to .env and fill in your values.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    }
  }
}

// Check if PAC CLI is installed
function checkPacCli() {
  try {
    execSync('pac help', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// Get PAC CLI version
function getPacVersion() {
  try {
    const output = execSync('pac', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const match = output.match(/Version:\s*([\d.]+)/);
    return match ? match[1] : 'unknown';
  } catch (error) {
    const match = error.stderr?.match(/Version:\s*([\d.]+)/);
    return match ? match[1] : 'unknown';
  }
}

// Run a command and stream output
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${command} ${args.join(' ')}\n`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

// Get solution info from solution.xml
function getSolutionInfo() {
  const solutionXmlPath = path.join(__dirname, '../solution/src/solution.xml');
  const solutionXml = fs.readFileSync(solutionXmlPath, 'utf8');

  const nameMatch = solutionXml.match(/<UniqueName>([^<]+)<\/UniqueName>/);
  const versionMatch = solutionXml.match(/<Version>([\d.]+)<\/Version>/);

  return {
    name: nameMatch ? nameMatch[1] : 'err403UILib',
    version: versionMatch ? versionMatch[1] : 'unknown'
  };
}

// Check current auth status
function getAuthStatus() {
  try {
    const result = execSync('pac auth list', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return result;
  } catch (error) {
    return error.stdout || '';
  }
}

// Authenticate with PAC CLI
async function authenticate() {
  const authMethod = process.env.D365_AUTH_METHOD || 'interactive';
  const url = process.env.D365_URL;

  if (!url) {
    console.error('❌ D365_URL is required in .env file');
    process.exit(1);
  }

  console.log(`\n🔐 Authenticating to: ${url}`);
  console.log(`   Method: ${authMethod}`);

  // Check if already authenticated to this environment
  const authList = getAuthStatus();
  if (authList.includes(url) && authList.includes('*')) {
    // Check if this environment is the active one (marked with *)
    const lines = authList.split('\n');
    for (const line of lines) {
      if (line.includes('*') && line.includes(url)) {
        console.log('✅ Already authenticated and selected');
        return;
      }
    }
    // Environment exists but not selected
    console.log('   Selecting existing auth profile...');
    await runCommand('pac', ['auth', 'select', '--environment', url]);
    console.log('✅ Auth profile selected');
    return;
  }

  try {
    if (authMethod === 'clientsecret') {
      const clientId = process.env.D365_CLIENT_ID;
      const clientSecret = process.env.D365_CLIENT_SECRET;
      const tenantId = process.env.D365_TENANT_ID;

      if (!clientId || !clientSecret || !tenantId) {
        console.error('❌ D365_CLIENT_ID, D365_CLIENT_SECRET, and D365_TENANT_ID are required for clientsecret auth');
        process.exit(1);
      }

      await runCommand('pac', [
        'auth', 'create',
        '--environment', url,
        '--applicationId', clientId,
        '--clientSecret', clientSecret,
        '--tenant', tenantId
      ]);
    } else {
      await runCommand('pac', ['auth', 'create', '--environment', url]);
    }

    console.log('✅ Authentication successful');
  } catch (error) {
    throw error;
  }
}

// Pack solution using the existing zip script
async function packSolution() {
  const { name, version } = getSolutionInfo();
  const solutionType = process.env.SOLUTION_TYPE || 'unmanaged';

  console.log(`\n📦 Packing ${solutionType} solution using archiver...`);
  console.log(`   Name: ${name}`);
  console.log(`   Version: ${version}`);

  // Run the existing pack script
  await runCommand('node', [path.join(__dirname, 'pack-solution-zip.js')]);

  const outputFile = path.join(__dirname, '../solution', `${name}_${version.replace(/\./g, '_')}_${solutionType}.zip`);
  return outputFile;
}

// Import solution to D365 using PAC CLI
async function importSolution(solutionZip) {
  console.log(`\n🚀 Importing solution to D365...`);
  console.log(`   File: ${solutionZip}`);

  await runCommand('pac', [
    'solution', 'import',
    '--path', solutionZip,
    '--publish-changes',
    '--async'
  ]);

  console.log('✅ Solution imported successfully!');
}

// Find the latest solution zip file
function findLatestSolutionZip() {
  const solutionDir = path.join(__dirname, '../solution');
  const solutionType = process.env.SOLUTION_TYPE || 'unmanaged';
  const { name } = getSolutionInfo();

  const files = fs.readdirSync(solutionDir)
    .filter(f => f.startsWith(name) && f.endsWith(`_${solutionType}.zip`))
    .map(f => ({
      name: f,
      path: path.join(solutionDir, f),
      mtime: fs.statSync(path.join(solutionDir, f)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return files.length > 0 ? files[0].path : null;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  D365 Solution Deployment Tool');
  console.log('═══════════════════════════════════════════════════════════════');

  // Load environment variables
  loadEnv();

  // Check PAC CLI
  if (!checkPacCli()) {
    console.error('\n❌ PAC CLI not found!');
    console.error('\nInstall it with one of these methods:');
    console.error('  1. dotnet tool install --global Microsoft.PowerApps.CLI.Tool');
    console.error('  2. Download from: https://aka.ms/PowerAppsCLI');
    console.error('  3. Install VS Code Power Platform Tools extension\n');
    process.exit(1);
  }

  const pacVersion = getPacVersion();
  console.log(`\nPAC CLI Version: ${pacVersion}`);
  console.log(`Environment: ${process.env.D365_URL}`);
  console.log(`Solution Type: ${process.env.SOLUTION_TYPE || 'unmanaged'}`);

  try {
    switch (command) {
      case 'pack':
        // Just pack the solution
        await packSolution();
        break;

      case 'auth':
        // Just authenticate
        await authenticate();
        break;

      case 'import': {
        // Import existing solution
        let zipFile = findLatestSolutionZip();

        if (!zipFile) {
          console.error('❌ No solution ZIP file found');
          console.error('   Run "npm run pack-solution" first');
          process.exit(1);
        }

        console.log(`\n📄 Found solution: ${path.basename(zipFile)}`);

        await authenticate();
        await importSolution(zipFile);
        break;
      }

      case 'deploy':
      default: {
        // Full deploy: pack + import
        await authenticate();
        await packSolution();

        const zipFile = findLatestSolutionZip();
        if (!zipFile) {
          console.error('❌ Solution ZIP not found after packing');
          process.exit(1);
        }

        await importSolution(zipFile);
        break;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  ✨ Done!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
