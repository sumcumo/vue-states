import base from './rollup.config.base'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-states.umd.js',
    format: 'umd',
    name: 'VueStates',
    exports: 'named',
    globals: {
      'vue-class-component': 'vueClassComponent',
    },
  },
})

export default config
