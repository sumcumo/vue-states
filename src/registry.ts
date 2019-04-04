import {
  Export,
  VueModel,
} from './types'

/**
 * root registry of history and models,
 * to be registered on the Vue prototype
 */
export default class Registry {
  public models: { [key: string]: VueModel } = {}
  private hydrationData: { [key: string]: () => object } = {}

  constructor(private readonly restoreOnReplace: boolean) {
  }

  register(vm: VueModel) {
    const current = this.models[vm.$options.modelGId]
    this.models[vm.$options.modelGId] = vm
    if (current && this.restoreOnReplace) {
      Object.entries(current.$data).forEach(([key, value]) => {
        if (vm.$data.hasOwnProperty(key)) {
          vm.$set(vm.$data, key, value)
        }
      })
    }
  }

  unregister(vm: VueModel) {
    if (this.models[vm.$options.modelGId] === vm) {
      delete this.models[vm.$options.modelGId]
    }
  }

  exportState(): Export {
    const mapped: Export = {}

    Object.keys(this.models)
      .forEach((key) => {
        mapped[key] = JSON.stringify(Object.assign({}, this.models[key].$data))
      })

    return mapped
  }

  importState(hydrModels: Export) {
    Object.keys(hydrModels)
      .forEach((key) => {
        this.hydrationData[key] = () => JSON.parse(hydrModels[key])
      })
  }

  getImportedStateFor(modelGId: string): (() => object) | undefined {
    const data = this.hydrationData[modelGId]
    delete this.hydrationData[modelGId]
    return data
  }
}
