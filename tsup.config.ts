import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  external: ['react', 'react-dom'],
  shims: true,
  esbuildOptions(options) {
    options.target = ['es2020'];
  },
});
