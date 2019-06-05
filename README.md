[![CircleCI](https://circleci.com/gh/sumcumo/vue-states.svg?style=svg)](https://circleci.com/gh/sumcumo/vue-states)
[![Maintainability](https://api.codeclimate.com/v1/badges/635869dc6220b29b1aa6/maintainability)](https://codeclimate.com/github/sumcumo/vue-states/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/635869dc6220b29b1aa6/test_coverage)](https://codeclimate.com/github/sumcumo/vue-states/test_coverage)

# Vue States
*Vue States is a state management system for Vue.js.*

Checkout the examples at https://github.com/JohannesLamberts/vue-states-examples.

You might want to choose to use Vue States for:

- **Simplicity** <br />Just `this.MyModel.key` and `this.MyModel.update(payload)`. No huge API, that exposes implementation details like `state, getters, commit, dispatch`.<br />Hot Module Replacement and Lazy-Loading made easy.
- **Flexible scope**<br />It is designed to support application-wide and local state, and can still be hydrated from  SSR or localStorage.
- **Learning & refactoring**<br />The state is composed of Vue components. That means: almost no new APIs and patterns to learn, plus seamless refactoring of your application.
- **Power**<br />All plugins and native Vue capabilities are accessible by design, without any configuration ( `this.$router, this.$apollo, created()...` ).
- **[History](#history)**<br />In combination with [Vue History](https://github.com/sumcumo/vue-history) you get a detailed view of what's going on, even for complex scenarios, async processes, error tracking and deeply nested call chains.

*This package was released just recently. Feedback is highly welcome.*

## Installation

The plugin can be installed without any further options: 

```javascript
import VueStates from '@sum.cumo/vue-states'
Vue.use(VueStates)
```

...or with additional configuration:

```javascript
Vue.use(
  VueStates, 
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

To keep track of what happens inside the models can check out [Vue History](https://github.com/sumcumo/vue-history), 
a package that was developed alongside Vue States but not only works for models but for any Vue component.

After installing Vue History you can enable it for all models by setting the `history: true` option:

```javascript
import VueHistory from '@sum.cumo/vue-history'
import VueStates from '@sum.cumo/vue-states'

Vue.use(VueHistory)

Vue.use(
  VueStates, 
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
{{{ renderState({ contextKey: 'vueModelState', windowKey: '__VUE_STATES__' }) }}}
```

```javascript
// main.js
import { Registry } from '@sum.cumo/vue-states'

export default async function createApp() {
  // ...
  
  const modelRegistry = new Registry()

  if (typeof window !== 'undefined' && window.__VUE_STATES__) {
    modelRegistry.importState(window.__VUE_STATES__)
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
  VueStates, 
  { mixins: [ { abstract: true } ] }
)
```

## License

Copyright 2019 [sum.cumo GmbH](https://www.sumcumo.com/)

Licensed under the Apache License, Version 2.0 (the “License”); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an “AS IS” BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

----

[Learn more about sum.cumo](https://www.sumcumo.com/en) and [work on open source projects](https://www.sumcumo.com/jobs), too!
