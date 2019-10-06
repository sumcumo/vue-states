import base from './rollup.config.base'
import { terser } from 'rollup-plugin-terser'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-states.min.js',
    format: 'iife',
    name: 'VueStates',
    exports: 'named',
    globals: {
      'vue-class-component': 'vueClassComponent',
    },
  },
})

config.plugins.push(terser())

export default config
