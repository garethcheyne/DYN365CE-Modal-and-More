import dts from 'rollup-plugin-dts';
import { readFileSync, writeFileSync } from 'fs';

export default {
  input: './build/index.d.ts',
  output: {
    file: './build/ui-lib.types.d.ts',
    format: 'es',
    banner: '',
    footer: `
/**
 * Global err403 namespace declarations
 */
export as namespace err403;

declare global {
    interface Window {
        err403: typeof import('./ui-lib.types');
    }
    
    const err403: Window['err403'];
}`
  },
  plugins: [dts()]
};
