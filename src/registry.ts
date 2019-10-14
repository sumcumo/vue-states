import { Vue } from 'vue/types/vue'
import { Export } from './types'

export interface ExportStateOptions {
  filterDefault?: boolean
  context?: any
}

/**
 * root registry of history and models,
 * to be registered on the Vue prototype
 */
export default class Registry {
  public models: { [key: string]: Vue } = {}
  private hydrationData: { [key: string]: () => object } = {}

  constructor(private readonly restoreOnReplace: boolean) {}

  register(vm: Vue) {
    const current = this.models[vm.$options.modelGId!]
    this.models[vm.$options.modelGId!] = vm
    if (current && this.restoreOnReplace) {
      Object.entries(current.$data).forEach(([key, value]) => {
        if (vm.$data.hasOwnProperty(key)) {
          vm.$set(vm.$data, key, value)
        }
      })
    }
  }

  unregister(vm: Vue) {
    if (this.models[vm.$options.modelGId!] === vm) {
      delete this.models[vm.$options.modelGId!]
    }
  }

  exportState({
    filterDefault = true,
    context,
  }: ExportStateOptions = {}): Export {
    const mapped: Export = {}

    Object.entries(this.models)
      .filter(([_, vm]) => {
        const { exportState } = vm.$options
        if (typeof exportState === 'undefined') {
          return filterDefault
        }
        if (typeof exportState === 'function') {
          return exportState.call(vm, context)
        }
        return exportState
      })
      .forEach(([key, vm]) => {
        mapped[key] = JSON.stringify(Object.assign({}, vm.$data))
      })

    return mapped
  }

  importState(hydrModels: Export) {
    Object.keys(hydrModels).forEach(key => {
      this.hydrationData[key] = () => JSON.parse(hydrModels[key])
    })
  }

  getImportedStateFor(modelGId: string): (() => object) | undefined {
    const data = this.hydrationData[modelGId]
    delete this.hydrationData[modelGId]
    return data
  }
}
