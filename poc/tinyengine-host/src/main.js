import './three-bridge.js'

const start = async () => {
  window.__TINY_ENGINE_THREE_POC ||= {
    toolbarMounted: false,
    runs: 0,
    commandSent: false,
    canvasReloadRequested: false,
    canvasReloadCompleted: false,
    lastInboundEvent: null,
    lastError: null
  }

  try {
    const [registryModule, engineModule] = await Promise.all([
      import('../registry.js'),
      import('@opentiny/tiny-engine')
    ])

    await engineModule.init({
      selector: '#app',
      registry: [registryModule.default],
      configurators: {},
      lifeCycles: {
        appMounted: () => {
          document.documentElement.dataset.tinyEngineMounted = 'true'
        }
      }
    })
  } catch (error) {
    window.__TINY_ENGINE_THREE_POC.lastError = error instanceof Error ? error.stack || error.message : String(error)
    document.documentElement.dataset.tinyEngineError = window.__TINY_ENGINE_THREE_POC.lastError
    throw error
  }
}

start()
