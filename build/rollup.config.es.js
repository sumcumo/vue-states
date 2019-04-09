import base from './rollup.config.base'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-states.esm.js',
    format: 'es',
    name: 'VueStates',
  },
})

export default config
