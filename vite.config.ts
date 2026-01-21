import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Read package.json for banner info
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const banner = `/*!
 * ${pkg.name} v${pkg.version}
 * Author: ${pkg.author}
 * Description: ${pkg.description}
 * License: ${pkg.license}
 * Build Date: ${new Date().toISOString()}
 */`;

export default defineConfig({
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'PACKAGE_VERSION': JSON.stringify(pkg.version),
    },
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'err403',
            formats: ['umd'],
            fileName: () => 'ui-lib.min.js',
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false,
            },
        },
        sourcemap: true,
        outDir: 'build',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                banner,
            },
            plugins: [
                {
                    name: 'add-banner',
                    generateBundle(options, bundle) {
                        // Add banner to the beginning of each chunk
                        Object.values(bundle).forEach((chunk) => {
                            if (chunk.type === 'chunk') {
                                chunk.code = banner + '\n' + chunk.code;
                            }
                        });
                    },
                },
            ],
            onwarn(warning, warn) {
                // Suppress "use client" directive warnings from Fluent UI
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
                // Suppress sourcemap warnings
                if (warning.message.includes('sourcemap')) return;
                warn(warning);
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
