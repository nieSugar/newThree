import { META_SERVICE, META_APP } from '@opentiny/tiny-engine-meta-register'
import engineConfig from './engine.config.js'
import { HttpService } from './src/composable/index.js'
import ThreePocToolbar from './src/three-toolbar/index.js'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig
  },
  [ThreePocToolbar.id]: ThreePocToolbar,
  [META_APP.Layout]: {
    options: {
      relativeLayoutConfig: {
        [ThreePocToolbar.id]: {
          insertAfter: META_APP.Media
        }
      }
    }
  }
}
