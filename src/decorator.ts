import { createDecorator } from 'vue-class-component'

// tslint:disable-next-line
export const InjectModel = createDecorator((options: any, key) => {
  if (!options.injectModels) {
    // eslint-disable-next-line no-param-reassign
    options.injectModels = []
  }
  options.injectModels.push(key)
})
