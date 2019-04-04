import base from './rollup.config.base'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-models.umd.js',
    format: 'umd',
    name: 'VueModels',
  },
})

export default config
