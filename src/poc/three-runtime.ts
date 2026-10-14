import * as THREE from 'three'

type BridgeMessage = {
  type: 'command' | 'event' | 'ready'
  name: string
  payload?: Record<string, unknown>
}

const root = document.querySelector<HTMLElement>('#three-app')!
Object.assign(document.body.style, { margin: '0', overflow: 'hidden', background: '#020617' })
Object.assign(root.style, { width: '100vw', height: '100vh' })

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x020617)

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
camera.position.set(2.5, 2, 4)
camera.lookAt(0, 0, 0)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
root.appendChild(renderer.domElement)

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.4, 1.4, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4, metalness: 0.1 })
)
cube.name = 'poc-cube'
scene.add(cube)

scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.2))
const key = new THREE.DirectionalLight(0xffffff, 2.5)
key.position.set(3, 4, 5)
scene.add(key)

const grid = new THREE.GridHelper(8, 8, 0x475569, 0x1e293b)
grid.position.y = -1.2
scene.add(grid)

const bootId = crypto.randomUUID()
;(window as Window & { __THREE_POC_BOOT_ID?: string }).__THREE_POC_BOOT_ID = bootId

const params = new URLSearchParams(window.location.search)
const explicitHostOrigin = params.get('hostOrigin')
const referrerOrigin = document.referrer ? new URL(document.referrer).origin : null
const allowedHostOrigin = explicitHostOrigin || referrerOrigin || window.location.origin

let port: MessagePort | null = null
let highlightUntil = 0

function emit(name: string, payload: Record<string, unknown>) {
  const message: BridgeMessage = { type: 'event', name, payload }
  port?.postMessage(message)
}

function resize() {
  const width = Math.max(1, root.clientWidth)
  const height = Math.max(1, root.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
}

new ResizeObserver(resize).observe(root)
resize()

window.addEventListener('message', (event: MessageEvent) => {
  if (event.origin !== allowedHostOrigin || event.data?.type !== 'THREE_CONNECT') return
  const nextPort = event.ports[0]
  if (!nextPort) return
  port = nextPort
  port.onmessage = (portEvent: MessageEvent<BridgeMessage>) => {
    const message = portEvent.data
    if (message.type !== 'command') return
    if (message.name === 'object.highlight' && message.payload?.objectId === 'poc-cube') {
      highlightUntil = performance.now() + 1200
      cube.rotation.x += 0.45
      cube.rotation.y += 0.8
      cube.scale.setScalar(1.18)
      cube.userData.highlightCount = (cube.userData.highlightCount ?? 0) + 1
      emit('object.highlighted', { objectId: cube.name, count: cube.userData.highlightCount })
    }
  }
  port.start()
  const ready: BridgeMessage = { type: 'ready', name: 'scene.ready', payload: { bootId } }
  port.postMessage(ready)
})

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  if (raycaster.intersectObject(cube, false).length > 0) {
    emit('object.click', { objectId: cube.name })
  }
})

renderer.setAnimationLoop((time) => {
  cube.rotation.y += 0.003
  if (highlightUntil && time > highlightUntil) {
    cube.scale.lerp(new THREE.Vector3(1, 1, 1), 0.12)
    if (Math.abs(cube.scale.x - 1) < 0.005) {
      cube.scale.setScalar(1)
      highlightUntil = 0
    }
  }
  renderer.render(scene, camera)
})
