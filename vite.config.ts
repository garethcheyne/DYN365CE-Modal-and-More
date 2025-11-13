import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
