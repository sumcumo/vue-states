import {
  createLocalVue,
  mount,
} from '@vue/test-utils'
import { ComponentOptions } from 'vue'
import { Vue } from 'vue/types/vue'
import VueStates from './index'
import { ExportStateOptions } from './registry'

const localVue = createLocalVue()
localVue.use(VueStates)

/* tslint:disable-next-line:variable-name */
const createModel = (value: string) => ({
  data() {
    return {
      key: value,
    }
  },
})

function createWrapper(
  exportState?: ComponentOptions<Vue>['exportState'],
) {
  return mount(
    {
      models: {
        one: {
          ...createModel('one'),
          exportState,
        },
      },
      render(h) {
        return h('div')
      },
    },
    { localVue },
  )
}

function exportFromWrapper(
  exportState?: ComponentOptions<Vue>['exportState'],
  options?: ExportStateOptions,
) {
  const wrapper = createWrapper(exportState)
  return wrapper.vm.$modelRegistry.exportState(options)
}

const standardExportedState = {
  'one~single': JSON.stringify({ key: 'one' }),
}

describe('registry', () => {
  it('should export state', () => {
    const wrapper = mount(
      {
        models: {
          one: createModel('one'),
          two: createModel('two'),
        },
        render(h) {
          return h('div')
        },
      },
      { localVue },
    )
    const exported = wrapper.vm.$modelRegistry.exportState()
    expect(exported)
      .toEqual({
        'one~single': JSON.stringify({ key: 'one' }),
        'two~single': JSON.stringify({ key: 'two' }),
      })
  })

  it('should filter exportState on boolean', () => {
    expect(exportFromWrapper(false))
      .toEqual({})
    expect(exportFromWrapper(true))
      .toEqual(standardExportedState)
  })

  it('should filter exportState on callback', () => {
    expect(exportFromWrapper(function () {
      // @ts-ignore
      return this.key === 'one'
    }))
      .toEqual(standardExportedState)
    expect(exportFromWrapper(function () {
      // @ts-ignore
      return this.key !== 'one'
    }))
      .toEqual({})
  })

  it('should forward args to callback', () => {
    let shouldExport = true

    const exportStateCallback = jest.fn(({ shouldExport }) => shouldExport)

    function exportWithContext() {
      return exportFromWrapper(
        exportStateCallback,
        { context: { shouldExport } },
      )
    }

    expect(exportWithContext())
      .toEqual(standardExportedState)
    expect(exportStateCallback)
      .toHaveBeenLastCalledWith({ shouldExport })

    shouldExport = false

    expect(exportWithContext())
      .toEqual({})
    expect(exportStateCallback)
      .toHaveBeenLastCalledWith({ shouldExport })
  })

  it('should use default when exportState is undefined', () => {
    expect(exportFromWrapper())
      .toEqual(standardExportedState)
    expect(exportFromWrapper(undefined, { filterDefault: false }))
      .toEqual({})
  })
})
