import '../styles.css'

type BridgeMessage = {
  type: 'command' | 'event' | 'ready'
  name: string
  payload?: Record<string, unknown>
}

const lowcodeRoot = document.querySelector<HTMLElement>('#lowcode-root')!
const runtimeLayer = document.querySelector<HTMLElement>('#three-runtime-layer')!
const runtimeFrame = document.querySelector<HTMLIFrameElement>('#three-runtime-frame')!

Object.assign(document.body.style, {
  margin: '0',
  minHeight: '100vh',
  background: '#0b1020',
  color: '#eef2ff',
  fontFamily: 'system-ui, sans-serif'
})

Object.assign(runtimeLayer.style, {
  position: 'fixed',
  inset: '0',
  pointerEvents: 'none',
  zIndex: '2'
})

Object.assign(runtimeFrame.style, {
  position: 'fixed',
  border: '1px solid rgba(148,163,184,.45)',
  borderRadius: '12px',
  background: '#020617',
  pointerEvents: 'auto'
})

let port: MessagePort | null = null
let connected = false
let remountCount = 0
let expanded = false
let lastObject = '-'
let lastRuntimeBootId = '-'

function send(name: string, payload: Record<string, unknown> = {}) {
  if (!port) return
  const message: BridgeMessage = { type: 'command', name, payload }
  port.postMessage(message)
}

function syncViewport() {
  const anchor = document.querySelector<HTMLElement>('#three-viewport-anchor')
  if (!anchor) {
    runtimeFrame.style.visibility = 'hidden'
    return
  }

  const rect = anchor.getBoundingClientRect()
  runtimeFrame.style.visibility = 'visible'
  runtimeFrame.style.left = `${rect.left}px`
  runtimeFrame.style.top = `${rect.top}px`
  runtimeFrame.style.width = `${rect.width}px`
  runtimeFrame.style.height = `${rect.height}px`
}

function renderLowCodeSurface() {
  remountCount += 1
  lowcodeRoot.innerHTML = `
    <section style="position:relative;z-index:1;min-height:100vh;padding:24px;box-sizing:border-box">
      <header style="display:flex;gap:12px;align-items:center;margin-bottom:18px">
        <strong>TinyEngine lifecycle simulator</strong>
        <button id="highlight-btn">低代码 → 3D：高亮/旋转立方体</button>
        <button id="resize-btn">调整 3D 面板大小</button>
        <button id="remount-btn">模拟 Schema/Page 重渲染</button>
      </header>
      <div style="display:grid;grid-template-columns:260px 1fr;gap:18px">
        <aside style="padding:16px;border:1px solid #334155;border-radius:12px;background:#111827">
          <div>Low-code remount: <b data-testid="remount-count">${remountCount}</b></div>
          <div style="margin-top:8px">Three boot id: <b data-testid="boot-id">${lastRuntimeBootId}</b></div>
          <div style="margin-top:8px">3D clicked: <b data-testid="selected-object">${lastObject}</b></div>
          <p style="color:#94a3b8;line-height:1.5">右侧只是 ThreeViewport 占位。真正 iframe 是 lowcode-root 的兄弟节点，因此这里重建不会销毁 3D runtime。</p>
        </aside>
        <div id="three-viewport-anchor" data-testid="three-viewport" style="height:${expanded ? '620px' : '420px'};border:1px dashed #64748b;border-radius:12px"></div>
      </div>
    </section>
  `

  document.querySelector('#highlight-btn')?.addEventListener('click', () => {
    send('object.highlight', { objectId: 'poc-cube' })
  })

  document.querySelector('#resize-btn')?.addEventListener('click', () => {
    expanded = !expanded
    renderLowCodeSurface()
  })

  document.querySelector('#remount-btn')?.addEventListener('click', () => {
    renderLowCodeSurface()
  })

  requestAnimationFrame(syncViewport)
}

const resizeObserver = new ResizeObserver(syncViewport)
resizeObserver.observe(document.documentElement)
window.addEventListener('scroll', syncViewport, true)
window.addEventListener('resize', syncViewport)

runtimeFrame.addEventListener('load', () => {
  if (connected) return
  const channel = new MessageChannel()
  port = channel.port1
  port.onmessage = (event: MessageEvent<BridgeMessage>) => {
    const message = event.data
    if (message.type === 'ready') {
      connected = true
      lastRuntimeBootId = String(message.payload?.bootId ?? '-')
      renderLowCodeSurface()
      return
    }
    if (message.type === 'event' && message.name === 'object.click') {
      lastObject = String(message.payload?.objectId ?? '-')
      const target = document.querySelector('[data-testid="selected-object"]')
      if (target) target.textContent = lastObject
    }
  }
  runtimeFrame.contentWindow?.postMessage({ type: 'THREE_CONNECT' }, window.location.origin, [channel.port2])
})

renderLowCodeSurface()
