
// rollup.config.js
const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')
const resolve = require('@rollup/plugin-node-resolve')
const typescript = require('@rollup/plugin-typescript')
const {terser} = require('@rollup/plugin-terser')
const { name, version, main, browser, author } = require('./package.json');
const ts = require('typescript')

const isProduction = process.env.NODE_ENV === 'production'

const settings = {
  globals: {
    ms: 'ms'
  },
}

module.exports = {
  input: './src/index.ts',
  output: [
    {
      file: "./dist/umd/bundle.js",
      format: 'umd',
      name: 'URLRewriteLanguage',
    },
    {
      file: "./dist/esm/bundle.js",
      format: "esm",
      name: 'URLRewriteLanguage',
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
