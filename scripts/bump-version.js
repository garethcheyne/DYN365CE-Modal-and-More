#!/usr/bin/env node
/**
 * Version Bump Script
 * Updates version in package.json using YYYY.MM.DD.NN format
 * Usage: npm run version:bump [increment]
 */

const fs = require('fs');
const path = require('path');

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Get current version
const currentVersion = packageJson.version;
console.debug(`Current version: ${currentVersion}`);

// Parse version (YYYY.MM.DD.NN)
const versionParts = currentVersion.split('.');
const year = parseInt(versionParts[0]);
const month = parseInt(versionParts[1]);
const day = parseInt(versionParts[2]);
const build = parseInt(versionParts[3] || 1);

// Get today's date
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const currentDay = today.getDate();

// Calculate new version
let newVersion;
if (year === currentYear && month === currentMonth && day === currentDay) {
  // Same day - increment build number
  newVersion = `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}.${(build + 1).toString().padStart(2, '0')}`;
} else {
  // New day - reset build number to 01
  newVersion = `${currentYear}.${currentMonth.toString().padStart(2, '0')}.${currentDay.toString().padStart(2, '0')}.01`;
}

console.debug(`New version: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8');

console.debug('✅ Version updated successfully!');
console.debug(`\nNext steps:`);
console.debug(`  1. Review changes: git diff package.json`);
console.debug(`  2. Commit: git add . && git commit -m "chore: bump version to ${newVersion}"`);
console.debug(`  3. Push: git push origin main`);
console.debug(`\nGitHub Actions will automatically create a release.`);
