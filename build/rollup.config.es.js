import base from './rollup.config.base'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-models.esm.js',
    format: 'es',
    name: 'VueModels',
  },
})

export default config
