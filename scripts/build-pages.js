#!/usr/bin/env node

/**
 * Build script for D365 pages
 * Builds each page separately to enable inlineDynamicImports for D365 compatibility
 */

const { execSync } = require('child_process');
const path = require('path');

// About is the main page containing all tabs (Documentation, Demo, Tests)
const pages = ['about'];

console.debug('🚀 Building D365 pages (self-contained bundles)...\n');

for (const page of pages) {
  console.debug(`📦 Building ${page} page...`);
  try {
    execSync(`npx vite build --config vite.pages.config.ts`, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, BUILD_PAGE: page },
      stdio: 'inherit'
    });
    console.debug(`✅ ${page} page built successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${page} page`);
    process.exit(1);
  }
}

console.debug('✨ All pages built successfully!');
