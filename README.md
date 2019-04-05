[![CircleCI](https://circleci.com/gh/sumcumo/vue-models.svg?style=svg)](https://circleci.com/gh/sumcumo/vue-models)
[![Maintainability](https://api.codeclimate.com/v1/badges/c92c47325f3c5453540d/maintainability)](https://codeclimate.com/github/sumcumo/vue-models/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/c92c47325f3c5453540d/test_coverage)](https://codeclimate.com/github/sumcumo/vue-models/test_coverage)

# VueModels
*VueModels is a state management system for Vue.js.*

You might want to choose to use VueModels for:

- **simplicity** <br />no `.state.foo`, `.getters.foo`, `.commit('changeFoo', 'bar')`, `.dispatch('changeFoo', 'bar')`, <br />just `State.foo` and `State.changeFoo('bar')`
- **flexible scope**<br />its made to support global and local state, even in combination with SSR or localStorage
- **learning curve & refactoring**<br />store modules = vue components => almost no new APIs and patterns to learn, seamless refactoring of mixins and components
- **unlimited power**<br />as VueModels are just Vue components, that become part of the tree, all plugins are accessible by default (`this.$router`, `this.$apollo`, ...)
- **[history](#history)**<br />in combination with [vue-history](https://github.com/sumcumo/vue-history) you get a comprehensive view of what's going on
- **[hot-module-replacement](#installation)**<br />models can preserve their state when beeing replaced

*This package was released just recently. Feedback is highly welcome.*

## Installation

The plugin can be installed without any further options: 

```javascript
import VueModels from 'vue-models'
Vue.use(VueModels)
```

...or with additional configuration:

```javascript
Vue.use(
  VueModels, 
  {
    // equal to Vue mixins, will be applied to every created model
    mixins: [],

    // a models state will be restored
    // if an old match (same name and modelId) is found
    // can be used to preserve state during hot module replacement 🚀
    // default: false
    restoreOnReplace: process.env.NODE_ENV === 'development', 

    // registers models on the $root instance, same as
    // const app = new Vue({ models: globalModels })
    globalModels,
  }
)
```

## Getting started

### Declare

A model is declared like any other vue-component, only that it doesn't contain any template or render option.

```javascript
import productsGQL from '@/api/queries/fakeProducts.graphql'

export default {
  data() {
    return {
      stage: '',
      products: [],
    }
  },
  
  // created / destroy hooks are invoked 
  created() {
    this.stage = 'created'
    this.loadProducts()
  },
  
  // vuex mutations and actions become just methods
  methods: {
    async loadProducts() {
      this.saveProducts(await this.$api.loadProducts())
    },
    saveProducts(products) {
      this.products = products
    }
  },
  
  // vuex getters become computed
  computed: {
    stageUppercase() {
      return this.stage.toUpperCase()
    },
  },
}

```

### Hosting

A model is a renderless component that is provided by a hosting component.
It is available in the hosting component itself and any child component, that injects the model.

```javascript
import App from '@/models/example'

export default {

  name: 'ExampleHost',
  
  models: {
    // 'App' becomes the models name and the key to reference it
    App,
  },
  
  template: `
  <div>
    <!-- 
      the model is injected on the hosting component 
      and into every child component, that requests it via the inject option
    -->
    {{ App.stageUppercase }}
    <ExampleChild />
  </div>`,
}
```

### Injection

```javascript
export default {

  name: 'ExampleChild',
  
  injectModels: [
    'App',
  ],
  
  template: `
  <div>
    <!-- properties are reactive -->
    {{App.products.length}} 
    <!-- methods are accessible through the injected object -->
    <button @click="App.refetch" />
  </div>`,
}
```


## History 

To keep track of what happens inside the models can check out [vue-history](https://github.com/sumcumo/vue-history), 
a package that was developed alongside VueModels but not only works for models but for any Vue component.

After installing VueHistory you can enable it for all models by setting the `history: true` option:

```javascript
import VueHistory from 'vue-history'
import VueModels from 'vue-models'

Vue.use(VueHistory)

Vue.use(
  VueModels, 
  { mixins: [ { history: true } ] }
)
```



## State export/import

State can be exported from and imported into the root model registry.
The imported state will be used when initializing models with matching name and modelId.
The state must therefore be imported *before* the model is initialized.

```javascript
const exported = app.$modelRegistry.exportState()
app.$modelRegistry.importState(exported)
```

Using export/import you can persist state to localStorage or initialize state before Client Side Hydration after SSR.

### Server Side Rendering

```javascript
// entry-server.js
Object.defineProperty(context, 'vueModelState', {
  get: () => {
    return app.$modelRegistry.exportState()
  },
})
``` 

```html
<!-- index.html -->
{{{ renderState({ contextKey: 'vueModelState', windowKey: '__VUE_MODELS_STATE__' }) }}}
```

```javascript
// main.js
import { ModelRegistry } from 'vue-models'

export default async function createApp() {
  // ...
  
  const modelRegistry = new ModelRegistry()

  if (typeof window !== 'undefined' && window.__VUE_MODELS_STATE__) {
    modelRegistry.importState(window.__VUE_MODELS_STATE__)
  }

  const app = new Vue({
    // you only need to provide this option if you need to import an initial state
    // the registry will be automatically initialized otherwise
    modelRegistry,
    // ...
  })
}
```

### Multi-Instances

When using models for non application-wide state you might have multiple instances of the same model running concurrently.
For import/export to work you will need to provide an id to further identify the different models.

```javascript
export default modelId => ({
    // the combination of name and modelId must be unique at any given time 
    modelId, 

    data() {
      return {
        counter: 0,
      }
    },
    
    methods: {
      increment() {
        this.counter += 1
      },
    },
})
```

```javascript
import createCounter from '@/models/counter'

export default {
  props: {
    someIdentifier: {
      type: String,
      required: true,
    }
  },
  
  // you may also pass a function that is evaluated in the created hook 
  // and receives the hosting Vue component as context
  models() {
    return {
      Counter: createCounter(this.someIdentifier),
    }
  }
}
```

## Nuxt.js

Nuxt.js gets confused by the models attached to the component tree. The errors can be resolved by adding `abtract: true` to all models (which however makes them invisible in the developer tools).

```javascript
Vue.use(
  VueModels, 
  { mixins: [ { abstract: true } ] }
)
```

## License

Copyright 2019 [sum.cumo GmbH](https://www.sumcumo.com/)

Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

----

[Learn more about sum.cumo](https://www.sumcumo.com/en/) or [work on open source projects](https://www.sumcumo.com/jobs/), too!
