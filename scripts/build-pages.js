#!/usr/bin/env node

/**
 * Build script for D365 pages
 * Builds each page separately to enable inlineDynamicImports for D365 compatibility
 */

const { execSync } = require('child_process');
const path = require('path');

const pages = ['about'];

console.log('🚀 Building D365 pages (self-contained bundles)...\n');

for (const page of pages) {
  console.log(`📦 Building ${page} page...`);
  try {
    execSync(`npx vite build --config vite.pages.config.ts`, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, BUILD_PAGE: page },
      stdio: 'inherit'
    });
    console.log(`✅ ${page} page built successfully\n`);
  } catch (error) {
    console.error(`❌ Failed to build ${page} page`);
    process.exit(1);
  }
}

console.log('✨ All pages built successfully!');
