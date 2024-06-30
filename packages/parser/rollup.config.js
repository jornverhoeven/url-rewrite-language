
// rollup.config.js
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const resolve = require('@rollup/plugin-node-resolve')
const typescript = require('@rollup/plugin-typescript')

module.exports = {
  input: './src/index.ts',
  output: [
    {
      file: "./dist/umd/bundle.js",
      format: 'umd',
      name: 'Parser',
    },
    {
      file: "./dist/esm/bundle.js",
      format: "esm",
      name: 'Parser',
    }
  ],
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true
    }),
    typescript({
      typescript: require('typescript'),
      tsconfig: 'tsconfig.json',
    }),
    commonjs({
      include: 'node_modules/**',
      extensions: [ '.js' ],
      ignoreGlobal: false,
      sourceMap: false
    }),
  ]
}
