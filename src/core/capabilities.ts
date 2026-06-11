export interface RuntimeCapabilities {
  webgl2: boolean;
  webgpu: boolean;
  webxr: boolean;
  pointerLock: boolean;
  devicePixelRatio: number;
}

export function detectCapabilities(): RuntimeCapabilities {
  const canvas = document.createElement('canvas');

  return {
    webgl2: Boolean(canvas.getContext('webgl2')),
    webgpu: 'gpu' in navigator,
    webxr: 'xr' in navigator,
    pointerLock: 'pointerLockElement' in document,
    devicePixelRatio: window.devicePixelRatio || 1
  };
}
