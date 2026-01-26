#!/usr/bin/env node
/**
 * Git Release Script
 * Bumps version, commits, creates tag, and pushes
 * Usage: npm run git:release
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting release process...\n');

// Step 1: Bump version
console.log('📝 Step 1: Bumping version...');
execSync('node scripts/bump-version.js', { stdio: 'inherit' });

// Read the new version from package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const newVersion = packageJson.version;

console.log(`\n✅ Version bumped to: ${newVersion}\n`);

// Step 2: Git add all changes
console.log('📦 Step 2: Staging all changes...');
try {
  execSync('git add .', { stdio: 'inherit' });
  console.log('✅ All changes staged\n');
} catch (error) {
  console.error('❌ Failed to stage changes');
  process.exit(1);
}

// Step 3: Git commit
console.log('💾 Step 3: Committing changes...');
try {
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  console.log('✅ Changes committed\n');
} catch (error) {
  console.error('❌ Failed to commit changes');
  process.exit(1);
}

// Step 4: Create tag
console.log('🏷️  Step 4: Creating tag...');
const tagName = `v${newVersion}`;
try {
  execSync(`git tag ${tagName}`, { stdio: 'inherit' });
  console.log(`✅ Tag created: ${tagName}\n`);
} catch (error) {
  console.error('❌ Failed to create tag');
  process.exit(1);
}

// Step 5: Push commit
console.log('⬆️  Step 5: Pushing commit...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Commit pushed\n');
} catch (error) {
  console.error('❌ Failed to push commit');
  process.exit(1);
}

// Step 6: Push tag
console.log('⬆️  Step 6: Pushing tag...');
try {
  execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
  console.log(`✅ Tag pushed: ${tagName}\n`);
} catch (error) {
  console.error('❌ Failed to push tag');
  process.exit(1);
}

console.log('🎉 Release complete!\n');
console.log(`Version: ${newVersion}`);
console.log(`Tag: ${tagName}`);
console.log(`\n🔗 GitHub Actions will now build and create the release.`);
console.log(`   Check: https://github.com/your-org/your-repo/actions\n`);
