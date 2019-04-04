import { ComponentOptions } from 'vue/types/options'
import { Vue } from 'vue/types/vue'
import Registry from './registry'

export interface VueModelOptions extends ComponentOptions<Vue> {
  modelId?: string,
}

export interface VueModelOptionsFinal extends ComponentOptions<Vue> {
  name: string,
  modelId: string,
  modelGId: string,
}

export interface VueModel extends Vue {
  $options: Vue['$options'] & VueModelOptionsFinal,
}

export interface VueModelMap {
  [key: string]: VueModelOptions,
}

export interface VueModelProvided extends Vue {
  $modelsProvidedKeys: string[],
  $modelsProvided: { [key: string]: VueModel },
  $modelRegistry: Registry,
  $options: Vue['$options'] & {
    modelRegistry: Registry,
    models?: VueModelMap | ((this: Vue) => VueModelMap),
    injectModels: string[],
  },
}

export interface ModelInstallOptions {
  mixins: Required<ComponentOptions<Vue>>['mixins'],
  restoreOnReplace: boolean,
  globalModels: VueModelMap,
}

export interface Export {
  [key: string]: string
}
