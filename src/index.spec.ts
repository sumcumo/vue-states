import {
  createLocalVue,
  mount,
} from '@vue/test-utils'
import VueModels from './index'
import Registry from './registry'

/* tslint:disable-next-line:variable-name */
const GlobalModel = {
  data() {
    return {
      globalData: true,
    }
  },
}

const localVue = createLocalVue()
localVue.use(VueModels)

/* tslint:disable-next-line:variable-name */
const SomeModel = {
  modelId: 'someId',
  data() {
    return {
      foo: 'bar',
    }
  },
}

/* tslint:disable-next-line:variable-name */
const SomeSingleModel = {
  data() {
    return {
      singleFoo: 'singleBar',
    }
  },
}

/* tslint:disable-next-line:variable-name */
const SomeStatelessModel = {
  methods: {
    ping() {
      return 'pong'
    },
  },
}

const models = {
  SomeModel,
  SomeSingleModel,
  SomeStatelessModel,
}

const provideComponent = (renderedComponent: any) => ({
  name: 'ProviderComponent',
  models,
  render(h: any) {
    return h(renderedComponent)
  },
} as any)

const consumerComponent = {
  name: 'ConsumerComponent',
  injectModels: ['SomeModel'],
  render(
    this: any,
    h: any,
  ) {
    return h('div', { domProps: { id: 'fooContainer' } }, this.SomeModel.foo)
  },
}

describe('vue-models', async () => {
  let wrapper: any

  let mockError: jest.Mock<any>
  let storedError: any

  beforeEach(() => {
    const c = provideComponent(consumerComponent)
    wrapper = mount(c, { localVue })
    mockError = jest.fn()
    storedError = global.console.error
    global.console.error = mockError
  })

  afterEach(() => {
    global.console.error = storedError
  })

  // adding elements to $root seems to be incompatible with mount()
  it('should add globalModels to the root component', () => {
    const globalModelsVue = createLocalVue()
    globalModelsVue.use(VueModels, {
      globalModels: {
        GlobalModel,
      },
    })

    const model = new globalModelsVue() as any
    expect(model.GlobalModel).toBeInstanceOf(globalModelsVue)
    expect(model.GlobalModel.globalData).toBe(true)
    expect(model.GlobalModel.$options.modelId).toBe('global')
  })

  it('should add the model as property on the providing component', () => {
    expect(wrapper.vm.SomeModel).toBeInstanceOf(localVue)
  })

  it('should provide models down the tree', () => {
    expect((wrapper.find(consumerComponent) as any).vm.SomeModel).toBe(wrapper.vm.SomeModel)
    expect(wrapper.find('#fooContainer').text()).toBe('bar')
  })

  it('should allow standard components as part of the chain', () => {
    const middleComponent = {
      name: 'MiddleComponent',
      render(h: any) {
        return h(consumerComponent)
      },
    }
    wrapper = mount(provideComponent(middleComponent), { localVue })

    expect((wrapper.find(consumerComponent) as any).vm.SomeModel).toBe(wrapper.vm.SomeModel)
    expect(wrapper.find('#fooContainer').text()).toBe('bar')
  })

  it('should be reactive to updates inside the model', () => {
    wrapper.vm.SomeModel.foo = 'otherValue'
    expect(wrapper.find('#fooContainer').text()).toBe('otherValue')
  })

  it('should resolve circular dependencies between siblings', () => {
    wrapper = mount(
      {
        render(
          this: any,
          h: Function,
        ) {
          return h('div', this.SiblingOne.oneData)
        },
        models: {
          SiblingOne: {
            injectModels: ['SiblingTwo'],
            data() {
              return {
                oneData: 1,
              }
            },
          },
          SiblingTwo: {
            injectModels: ['SiblingOne'],
            data() {
              return {
                twoData: 2,
              }
            },
          },
        },
      } as any,
      { localVue },
    )

    expect(mockError).not.toHaveBeenCalled()
    expect(wrapper.vm.SiblingTwo.SiblingOne.oneData).toBe(1)
    expect(wrapper.vm.SiblingOne.SiblingTwo.twoData).toBe(2)
  })

  it('should allow to dynamically create the model with the hosting context', () => {
    wrapper = mount(
      {
        props: ['someKey'],
        models(this: any) {
          return { Dynamic: Object.assign({}, SomeModel, { modelId: this.someKey }) }
        },
        render(this: any, h: Function) {
          return h('div', this.Dynamic.foo)
        },
      } as any,
      {
        localVue,
        propsData: {
          someKey: 'uniqueIdentifier123',
        },
      },
    )

    expect(Object.keys(wrapper.vm.$modelRegistry.models)).toEqual(['Dynamic~uniqueIdentifier123'])
    expect(wrapper.vm.Dynamic.$options.modelId).toBe('uniqueIdentifier123')
    expect(wrapper.text()).toBe('bar')
  })

  it('should allow adding custom mixins', () => {
    const localVueWithMixins = createLocalVue()

    localVueWithMixins.use(VueModels, {
      mixins: [{ someProp: 'has_an_installed_mixin' }],
    })

    wrapper = mount(
      {
        models: {
          Simple: {
            data() {
              return { foo: 'bar' }
            },
            mixins: [
              {
                someOtherProp: 'has_a_local_mixin',
              },
            ],
          },
        },
        render(
          this: any,
          h: Function,
        ) {
          return h(
            'div',
            [this.Simple.foo, this.Simple.$options.someProp, this.Simple.$options.someOtherProp].join(
              ','),
          )
        },
      } as any,
      { localVue: localVueWithMixins },
    )

    expect(wrapper.text()).toBe(['bar', 'has_an_installed_mixin', 'has_a_local_mixin'].join(','))
  })

  it('should create a $modelRegistry property on every instance', () => {
    expect(wrapper.vm.$modelRegistry).toBeInstanceOf(Registry)
    expect((wrapper.find(consumerComponent) as any).vm.$modelRegistry).toBe(wrapper.vm.$modelRegistry)
  })

  it('should register every created model', () => {
    const { models } = wrapper.vm.$modelRegistry
    expect(Object.keys(models)).toEqual(
      ['SomeModel~someId',
        'SomeSingleModel~single',
        'SomeStatelessModel~single',
      ])
    expect(models['SomeModel~someId']).toBe(wrapper.vm.SomeModel)
    expect(models['SomeSingleModel~single']).toBe(wrapper.vm.SomeSingleModel)
  })

  it('should unregister every destroyed model', () => {
    wrapper.vm.$destroy()
    expect(Object.keys(wrapper.vm.$modelRegistry.models)).toHaveLength(0)
  })

  it('should use imported state if provided', () => {
    // this is executed server-side
    wrapper.vm.SomeModel.foo = 'otherValue'

    const exported = wrapper.vm.$modelRegistry.exportState()
    expect(Object.keys(exported)).toHaveLength(3)

    const exportedStringified = JSON.stringify(exported) // just to make sure this doesn't make a difference

    // this is executed client-side
    const modelRegistry = new Registry(false)
    modelRegistry.importState(JSON.parse(exportedStringified))

    // @ts-ignore
    expect(Object.keys(modelRegistry.hydrationData)).toHaveLength(3)

    const hydratedWrapper = mount(
      provideComponent(consumerComponent),
      {
        localVue,
        parentComponent: { modelRegistry } as any,
      },
    )

    expect(Object.is((hydratedWrapper.vm as any).$modelRegistry, modelRegistry)).toBe(true)

    // soft proof, that client and server-side are not accidentally connected
    wrapper.vm.SomeModel.foo = 'otherOtherValue'

    expect(wrapper.find('#fooContainer').text()).toBe('otherOtherValue')
    expect(hydratedWrapper.find('#fooContainer').text()).toBe('otherValue')

    // @ts-ignore
    expect(Object.keys(modelRegistry.hydrationData)).toHaveLength(0)
  })

  it('should restore state on replace only if activated', () => {
    function testRegistry(restoreOnReplace: boolean) {
      const modelRegistry = new Registry(restoreOnReplace)

      function mountModel() {
        return (mount(
          provideComponent(consumerComponent),
          {
            localVue,
            parentComponent: { modelRegistry } as any,
          },
        ).vm as any).SomeModel
      }

      const initialModel = mountModel()

      expect(initialModel.foo).toBe('bar')
      initialModel.foo = '123456'

      const resetModel = mountModel()

      expect(resetModel.foo).toBe(restoreOnReplace ? '123456' : 'bar')
    }

    testRegistry(true)
    testRegistry(false)
  })
})
