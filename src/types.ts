import { ComponentOptions } from 'vue/types/options'
import { Vue } from 'vue/types/vue'
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

export interface VueModelMap {
  [key: string]: ComponentOptions<Vue>,
}

export interface VueModelProvided extends Vue {
  $modelsProvidedKeys: string[],
  $modelsProvided: { [key: string]: Vue },
  $modelRegistry: Registry,
}

export interface ModelInstallOptions {
  mixins: Required<ComponentOptions<Vue>>['mixins'],
  restoreOnReplace: boolean,
  globalModels: VueModelMap,
}

export interface Export {
  [key: string]: string
}
