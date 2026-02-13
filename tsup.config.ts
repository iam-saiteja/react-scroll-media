import { defineConfig } from 'tsup';
import pkg from './package.json';

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
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
  esbuildOptions(options) {
    options.target = ['es2020'];
  },
});
