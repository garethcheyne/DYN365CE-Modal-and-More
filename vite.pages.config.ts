import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, existsSync, writeFileSync, rmSync } from 'fs';

// Read package.json for version info
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Get current page from environment variable (for single-page builds)
// If not set, build all pages (for dev server)
const currentPage = process.env.BUILD_PAGE;
const allPages = ['about'];
const pagesToBuild = currentPage ? [currentPage] : allPages;

// Plugin to process HTML files for D365 compatibility
const processHtmlForD365 = () => ({
  name: 'process-html-for-d365',
  closeBundle() {
    pagesToBuild.forEach(page => {
      const src = resolve(__dirname, `release/pages/${page}.html`);
      const dest = resolve(__dirname, `release/${page}.html`);
      if (existsSync(src)) {
        // Read the file and fix for D365 compatibility
        let content = readFileSync(src, 'utf-8');
        // Fix absolute paths to relative paths
        content = content.replace(/href="\/assets\//g, 'href="./assets/');
        content = content.replace(/src="\/assets\//g, 'src="./assets/');
        // Remove crossorigin attribute - D365 doesn't need CORS for same-origin web resources
        content = content.replace(/ crossorigin/g, '');
        // Remove modulepreload links - not used when each page is self-contained
        content = content.replace(/<link rel="modulepreload"[^>]*>\n?/g, '');
        // Write to release root
        writeFileSync(dest, content, 'utf-8');
        console.log(`  Processed: ${page}.html`);
      }
    });

    // Clean up the pages subfolder
    const pagesDir = resolve(__dirname, 'release/pages');
    if (existsSync(pagesDir)) {
      rmSync(pagesDir, { recursive: true, force: true });
    }
  }
});

// Build input configuration
const buildInput = currentPage
  ? { [currentPage]: resolve(__dirname, `pages/${currentPage}.html`) }
  : Object.fromEntries(allPages.map(p => [p, resolve(__dirname, `pages/${p}.html`)]));

export default defineConfig({
  plugins: [react(), processHtmlForD365()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'PACKAGE_VERSION': JSON.stringify(pkg.version),
  },
  build: {
    outDir: 'release',
    emptyOutDir: false, // Don't empty - we have ui-lib files there
    rollupOptions: {
      input: buildInput,
      output: {
        // Use stable names (no hashes) for D365 web resource mapping
        entryFileNames: 'assets/page-[name].js',
        assetFileNames: 'assets/page-styles[extname]',
        // CRITICAL for D365: Inline all imports - no code splitting
        // $webresource: URLs don't support relative ES module imports
        ...(currentPage ? { inlineDynamicImports: true } : {}),
      },
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from Fluent UI
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message.includes('sourcemap')) return;
        warn(warning);
      },
    },
    minify: 'terser',
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  // Dev server for pages
  server: {
    open: '/pages/demo.html',
  },
});
