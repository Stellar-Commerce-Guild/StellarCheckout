import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default [
  // ESM
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // CJS
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.js', format: 'cjs', sourcemap: true, exports: 'named' },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
  },
  // IIFE for CDN / script tag
  {
    input: 'src/index.ts',
    output: { file: 'dist/stellarcheckout.min.js', format: 'iife', name: 'StellarCheckout', sourcemap: false },
    plugins: [resolve(), typescript({ tsconfig: './tsconfig.json' })],
  },
];
