import { ComponentOptions, VueConstructor } from 'vue'
import { Vue } from 'vue/types/vue'
import Registry from './registry'
import { ModelInstallOptions } from './types'

export * from './decorator'
export { Registry }

interface InstallContext {
  vue: VueConstructor
  installOptions: ModelInstallOptions
}

function resolveInjection(this: Vue, key: string) {
  // tslint:disable-next-line no-this-assignment
  let source = this
  let ressource: Vue | null = null

  while ((source = source.$parent)) {
    if (
      source.$modelsProvidedKeys &&
      source.$modelsProvidedKeys.includes(key)
    ) {
      ressource = source
      break
    }
  }

  if (ressource === null) {
    throw new Error(`No provider found for ${key}`)
  }

  Object.defineProperty(this, key, {
    get: () => (ressource as any)[key],
  })
}

function createModelOptions(
  vmHost: Vue,
  name: string,
  options: ComponentOptions<Vue>,
  mergeMixins: Required<ComponentOptions<Vue>>['mixins'],
): ComponentOptions<Vue> {
  const modelId = options.modelId || 'single'
  const modelGId = `${name}~${modelId}`
  const data =
    vmHost.$modelRegistry.getImportedStateFor(modelGId) ||
    options.data ||
    (() => ({}))
  const mixins = [...mergeMixins, ...(options.mixins || [])]

  return Object.assign({}, options, {
    mixins,
    name,
    modelId,
    modelGId,
    data,
    parent: vmHost,
  })
}

const OPTIONS_DEFAULTS: ModelInstallOptions = {
  mixins: [],
  restoreOnReplace: false,
  globalModels: {},
}

function createModel(
  this: Vue,
  context: InstallContext,
  key: string,
  optionsOrClass: ComponentOptions<Vue> | VueConstructor,
) {
  const isClass =
    typeof optionsOrClass === 'function' &&
    // check for 'super' to enable later support for options like
    // models: { Content: () => import('some-chunk') }
    typeof (optionsOrClass as any).super === 'function'

  const options = createModelOptions(
    this,
    key,
    isClass ? {} : (optionsOrClass as ComponentOptions<Vue>),
    context.installOptions.mixins,
  )
  const vm = new (isClass ? (optionsOrClass as VueConstructor) : context.vue)(
    options,
  )
  ;(this as any)[key] = this.$modelsProvided[key] = vm
  this.$modelRegistry.register(vm)

  this.$on('hook:beforeDestroy', () => {
    this.$modelRegistry.unregister(vm)
    vm.$destroy()
  })
}

function createModels(this: Vue, context: InstallContext) {
  this.$modelsProvided = {}

  if (!this.$options.models && this !== this.$root) {
    return
  }

  let { models = {} } = this.$options

  if (typeof models === 'function') {
    models = models.call(this)
  }

  if (this === this.$root) {
    const globalModels = context.installOptions.globalModels
    Object.values(globalModels).forEach(m => (m.modelId = 'global'))
    models = Object.assign({}, globalModels, models)
  }

  this.$modelsProvidedKeys = Object.keys(models)

  Object.entries(models).forEach(([key, options]) => {
    createModel.call(this, context, key, options)
  })
}

export default {
  install(
    vue: VueConstructor,
    rawInstallOptions: Partial<ModelInstallOptions> = {},
  ) {
    const installOptions: ModelInstallOptions = Object.assign(
      {},
      OPTIONS_DEFAULTS,
      rawInstallOptions,
    )

    vue.mixin({
      beforeCreate(this: Vue) {
        const { modelRegistry, injectModels } = this.$options
        this.$modelRegistry =
          this === this.$root
            ? modelRegistry || new Registry(installOptions.restoreOnReplace)
            : this.$root.$modelRegistry

        if (injectModels) {
          injectModels.forEach(inject => {
            resolveInjection.call(this, inject)
          })
        }
      },
      created(this: Vue) {
        createModels.call(this, { vue, installOptions })
      },
    })
  },
}
