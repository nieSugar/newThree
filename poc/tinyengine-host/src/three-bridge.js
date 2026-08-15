const frame = document.querySelector('#persistent-three-frame')
const pane = document.querySelector('#three-runtime-pane')
const status = document.querySelector('#three-status')

if (!frame || !pane || !status) {
  throw new Error('Persistent Three runtime shell is incomplete')
}

const targetOrigin = new URL(frame.src).origin
const state = {
  ready: false,
  bootId: null,
  loadCount: 0,
  lastEvent: null,
  lastReady: null
}

let port = null

const emitHostEvent = (message) => {
  window.dispatchEvent(new CustomEvent('three:poc-event', { detail: message }))
}

const connect = () => {
  if (!frame.contentWindow) return
  port?.close?.()
  const channel = new MessageChannel()
  port = channel.port1
  port.onmessage = (event) => {
    const message = event.data
    if (!message || typeof message !== 'object') return

    if (message.type === 'ready' && message.name === 'scene.ready') {
      state.ready = true
      state.bootId = message.payload?.bootId ?? null
      state.lastReady = message
      status.textContent = `ready · boot ${String(state.bootId).slice(0, 8)}`
      document.documentElement.dataset.threeBootId = state.bootId || ''
    }

    if (message.type === 'event') {
      state.lastEvent = message
      emitHostEvent(message)
    }
  }
  port.start()
  frame.contentWindow.postMessage({ type: 'THREE_CONNECT' }, targetOrigin, [channel.port2])
}

frame.addEventListener('load', () => {
  state.loadCount += 1
  state.ready = false
  status.textContent = 'connecting'
  connect()
})

// The module can execute after the iframe has already completed loading in a fast local run.
setTimeout(() => {
  if (!state.ready) connect()
}, 250)

const command = (name, payload = {}) => {
  if (!port) throw new Error('Three bridge is not connected')
  port.postMessage({ type: 'command', name, payload })
}

const toggleWide = () => {
  pane.dataset.mode = pane.dataset.mode === 'wide' ? 'normal' : 'wide'
  return pane.dataset.mode
}

window.__threePocBridge = {
  command,
  toggleWide,
  getState: () => ({ ...state, paneMode: pane.dataset.mode })
}

export default window.__threePocBridge
