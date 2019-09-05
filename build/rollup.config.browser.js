import base from './rollup.config.base'
import { uglify } from 'rollup-plugin-uglify'
import { minify } from 'uglify-es'

const config = Object.assign({}, base, {
  output: {
    file: 'dist/vue-states.min.js',
    format: 'iife',
    name: 'VueStates',
    exports: 'named',
    globals: {
      'vue-class-component': 'vueClassComponent'
    }
  },
})

config.plugins.push(uglify({}, minify))

export default config
