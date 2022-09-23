import { defineConfig } from 'tsup';

/**
 * Defines default config for tsup, used to bundle our libraries.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  format: ['esm'],
  // This does typechecking, as well as emits .d.ts and .d.ts.map files
  onSuccess: 'tsc --emitDeclarationOnly --declaration',
  outExtension({ format }) {
    return {
      js: format === 'esm' ? '.js' : `.${format}.js`,
    };
  },
});
