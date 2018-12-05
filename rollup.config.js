import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/kaia-utils.ts',
  plugins: [typescript()],
  output: [{
    file: 'dist/kaia-utils-iife.js',
    format: 'iife',
    name: 'kaiaUtilsJs'
  }, {
    file: 'dist/kaia-utils-cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/kaia-utils.mjs',
    format: 'es'
  }, {
    file: 'dist/kaia-utils-amd.js',
    format: 'amd',
  }]
};
