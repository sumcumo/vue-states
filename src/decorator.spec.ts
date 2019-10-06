import { InjectModel } from './decorator'
import Component from 'vue-class-component'
import Vue from 'vue'

describe('InjectModel', () => {
  @Component
  class Test extends Vue {
    @InjectModel test: any
  }
  it('maps correctly', () => {
    const component = new Test()
    expect(component.$options.injectModels).toStrictEqual(['test'])
  })
})
