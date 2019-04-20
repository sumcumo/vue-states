import { ComponentOptions } from 'vue/types/options'
import {
  Vue,
  VueConstructor,
} from 'vue/types/vue'
import Registry from './registry'

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    modelRegistry?: Registry,
    injectModels?: string[]
    models?: VueModelMap | ((this: Vue) => VueModelMap)
    modelId?: string,
    modelGId?: string,
  }
}

declare module 'vue/types/vue' {
  // Global properties can be declared
  // on the `VueConstructor` interface
  interface Vue {
    $modelsProvidedKeys?: string[],
    $modelsProvided: { [key: string]: Vue },
    $modelRegistry: Registry,
  }
}

export interface VueModelMap {
  [key: string]: ComponentOptions<Vue> | VueConstructor,
}

export interface ModelInstallOptions {
  mixins: Required<ComponentOptions<Vue>>['mixins'],
  restoreOnReplace: boolean,
  globalModels: {
    [key: string]: ComponentOptions<Vue>,
  },
}

export interface Export {
  [key: string]: string
}
