import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      'content/index': 'src/content/index.ts'
    },
    outDir: 'dist',
    format: ['iife'],
    splitting: false,
    sourcemap: false,
    clean: true,
    target: 'es2022',
    minify: false,
    dts: false,
    outExtension() {
      return { js: '.js' };
    }
  },
  {
    entry: {
      'background/service-worker': 'src/background/service-worker.ts'
    },
    outDir: 'dist',
    format: ['esm'],
    splitting: false,
    sourcemap: false,
    clean: false,
    target: 'es2022',
    minify: false,
    dts: false,
    outExtension() {
      return { js: '.js' };
    }
  }
]);
