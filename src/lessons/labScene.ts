import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import type { ControlValue, LabControl, LessonContext, LessonInstance, LessonKind, LessonMetrics, LessonRuntimeState } from '../types';

export interface LabSceneOptions {
  kind: LessonKind;
  accent: number;
  controls: LabControl[];
}

interface LessonSceneController {
  apply: (values: Record<string, ControlValue>) => void;
  tick: (delta: number, elapsed: number) => void;
  dispose?: () => void;
}

interface SceneServices {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  root: THREE.Group;
  camera: () => THREE.Camera;
  controls: () => OrbitControls;
  setCamera: (camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => void;
  setFlag: (key: string, value: ControlValue) => void;
  setStatus: (message: string) => void;
  accent: THREE.Color;
}

export function createLabScene(options: LabSceneOptions, context: LessonContext): LessonInstance {
  context.host.replaceChildren();

  const state: LessonRuntimeState = {
    controls: Object.fromEntries(options.controls.map((control) => [control.id, control.defaultValue])),
    flags: {},
    metrics: emptyMetrics()
  };

  const canvas = document.createElement('canvas');
  canvas.className = 'lesson-canvas';
  context.host.append(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151d);

  const perspectiveCamera = new THREE.PerspectiveCamera(52, 1, 0.1, 250);
  perspectiveCamera.position.set(5, 4, 7);

  const orthographicCamera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 250);
  orthographicCamera.position.copy(perspectiveCamera.position);

  let activeCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera = perspectiveCamera;
  let orbitControls = createOrbitControls(activeCamera, renderer.domElement);

  const root = new THREE.Group();
  root.name = 'lesson-root';
  scene.add(root);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnvironment = new RoomEnvironment();
  const environment = pmremGenerator.fromScene(roomEnvironment, 0.04).texture;
  scene.environment = environment;

  const hemisphere = new THREE.HemisphereLight(0xd7ecff, 0x27313d, 1.2);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2);
  keyLight.position.set(5, 7, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  scene.add(keyLight);

  const grid = new THREE.GridHelper(12, 12, 0x35566f, 0x20313f);
  grid.position.y = -1.25;
  scene.add(grid);

  const axes = new THREE.AxesHelper(2.5);
  axes.visible = Boolean(state.controls.showAxes ?? true);
  scene.add(axes);

  let composer: EffectComposer | undefined;
  let renderPass: RenderPass | undefined;
  let bloomPass: UnrealBloomPass | undefined;

  const services: SceneServices = {
    renderer,
    scene,
    root,
    camera: () => activeCamera,
    controls: () => orbitControls,
    setCamera(camera) {
      if (activeCamera === camera) {
        return;
      }
      const previousTarget = orbitControls.target.clone();
      orbitControls.dispose();
      activeCamera = camera;
      orbitControls = createOrbitControls(activeCamera, renderer.domElement);
      orbitControls.target.copy(previousTarget);
      orbitControls.update();
      if (renderPass) {
        renderPass.camera = activeCamera;
      }
      resize();
    },
    setFlag(key, value) {
      state.flags[key] = value;
      context.onStateChange({ ...state, flags: { ...state.flags } });
    },
    setStatus(message) {
      context.setStatus(message);
    },
    accent: new THREE.Color(options.accent)
  };

  const controller = buildLessonController(options.kind, services, state.controls);
  controller.apply(state.controls);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(context.host);
  resize();

  let frameId = 0;
  let frameCount = 0;
  let fpsElapsed = 0;
  let lastFps = 60;
  const timer = new THREE.Timer();
  timer.connect(document);

  function loop(timestamp?: number): void {
    frameId = window.requestAnimationFrame(loop);
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.05);
    const elapsed = timer.getElapsed();
    orbitControls.update();
    controller.tick(delta, elapsed);

    if (bloomPass) {
      composer?.render();
    } else {
      renderer.render(scene, activeCamera);
    }

    frameCount += 1;
    fpsElapsed += delta;
    if (fpsElapsed >= 0.5) {
      lastFps = Math.round(frameCount / fpsElapsed);
      frameCount = 0;
      fpsElapsed = 0;
    }

    state.metrics = readMetrics(renderer, root, lastFps);
    context.onMetrics(state.metrics);
    context.onStateChange({ ...state, metrics: { ...state.metrics } });
  }

  loop();

  function resize(): void {
    const rect = context.host.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(260, Math.floor(rect.height));
    renderer.setSize(width, height, false);

    perspectiveCamera.aspect = width / height;
    perspectiveCamera.updateProjectionMatrix();

    const orthoHeight = 6;
    const orthoWidth = orthoHeight * (width / height);
    orthographicCamera.left = -orthoWidth / 2;
    orthographicCamera.right = orthoWidth / 2;
    orthographicCamera.top = orthoHeight / 2;
    orthographicCamera.bottom = -orthoHeight / 2;
    orthographicCamera.updateProjectionMatrix();

    if (activeCamera instanceof THREE.PerspectiveCamera) {
      activeCamera.aspect = width / height;
      activeCamera.updateProjectionMatrix();
    } else if (activeCamera instanceof THREE.OrthographicCamera) {
      activeCamera.left = -orthoWidth / 2;
      activeCamera.right = orthoWidth / 2;
      activeCamera.top = orthoHeight / 2;
      activeCamera.bottom = -orthoHeight / 2;
      activeCamera.updateProjectionMatrix();
    }

    composer?.setSize(width, height);
  }

  function ensureComposer(): { composer: EffectComposer; bloomPass: UnrealBloomPass } {
    if (!composer || !bloomPass) {
      renderPass = new RenderPass(scene, activeCamera);
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.8, 0.45, 0.85);
      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
      resize();
    }
    return { composer, bloomPass };
  }

  services.setFlag('webgpuAvailable', 'gpu' in navigator);
  services.setFlag('webxrAvailable', 'xr' in navigator);
  services.setFlag('webgl2Available', Boolean(document.createElement('canvas').getContext('webgl2')));

  return {
    updateControls(values) {
      Object.assign(state.controls, values);
      axes.visible = Boolean(state.controls.showAxes ?? true);

      if ('exposure' in state.controls) {
        renderer.toneMappingExposure = Number(state.controls.exposure);
      }

      if ('bloomEnabled' in state.controls || 'bloomStrength' in state.controls) {
        const enabled = Boolean(state.controls.bloomEnabled);
        if (enabled) {
          const passes = ensureComposer();
          passes.bloomPass.strength = Number(state.controls.bloomStrength ?? 0.8);
        } else {
          bloomPass = undefined;
          composer?.dispose();
          composer = undefined;
        }
      }

      controller.apply(state.controls);
      context.onStateChange({ ...state, controls: { ...state.controls } });
    },
    getState() {
      return { ...state, controls: { ...state.controls }, flags: { ...state.flags }, metrics: { ...state.metrics } };
    },
    dispose() {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controller.dispose?.();
      timer.dispose();
      orbitControls.dispose();
      composer?.dispose();
      disposeObject(root);
      scene.remove(root);
      environment.dispose();
      roomEnvironment.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      context.host.replaceChildren();
    }
  };
}

function buildLessonController(
  kind: LessonKind,
  services: SceneServices,
  values: Record<string, ControlValue>
): LessonSceneController {
  switch (kind) {
    case 'foundation':
      return buildFoundation(services, values);
    case 'object3d':
      return buildObject3D(services, values);
    case 'geometry':
      return buildGeometry(services, values);
    case 'material':
      return buildMaterial(services, values);
    case 'lighting':
      return buildLighting(services, values);
    case 'camera':
      return buildCamera(services, values);
    case 'interaction':
      return buildInteraction(services, values);
    case 'assets':
      return buildAssets(services, values);
    case 'animation':
      return buildAnimation(services, values);
    case 'postprocessing':
      return buildPostprocessing(services, values);
    case 'optimization':
      return buildOptimization(services, values);
    case 'shader':
      return buildShader(services, values);
    case 'lifecycle':
      return buildLifecycle(services, values);
    case 'procedural':
      return buildProcedural(services, values);
    case 'particles':
      return buildParticles(services, values);
    case 'rendertarget':
      return buildRenderTarget(services, values);
    case 'shaderNoise':
      return buildShaderNoise(services, values);
    case 'cameraPath':
      return buildCameraPath(services, values);
    case 'world':
      return buildWorld(services, values);
    case 'hud':
      return buildHud(services, values);
    case 'product':
      return buildProduct(services, values);
    case 'dataviz':
      return buildDataViz(services, values);
    case 'portfolio':
      return buildPortfolio(services, values);
    case 'physics':
      return buildPhysics(services, values);
    case 'webxr':
      return buildWebXR(services, values);
    case 'webgpu':
      return buildWebGPU(services, values);
    default:
      return buildFoundation(services, values);
  }
}

function buildFoundation({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    new THREE.BoxGeometry(1.7, 1.7, 1.7),
    createStandardMaterial(accent.getHex(), 0.45, 0.35)
  );
  mesh.castShadow = true;
  root.add(mesh);
  root.add(makePedestal());

  let currentShape = String(values.shape ?? 'box');

  function setShape(shape: string): void {
    mesh.geometry.dispose();
    if (shape === 'sphere') {
      mesh.geometry = new THREE.SphereGeometry(1.05, 48, 24);
    } else if (shape === 'torus') {
      mesh.geometry = new THREE.TorusKnotGeometry(0.75, 0.24, 120, 16);
    } else {
      mesh.geometry = new THREE.BoxGeometry(1.7, 1.7, 1.7);
    }
  }

  return {
    apply(next) {
      const nextShape = String(next.shape ?? 'box');
      if (nextShape !== currentShape) {
        setFlag('changedShape', true);
      }
      setShape(nextShape);
      currentShape = nextShape;
      mesh.scale.setScalar(Number(next.scale ?? 1));
      const material = mesh.material as THREE.MeshStandardMaterial;
      material.wireframe = Boolean(next.wireframe);
    },
    tick(delta) {
      mesh.rotation.x += delta * Number(values.speed ?? 0.8);
      mesh.rotation.y += delta * Number(values.speed ?? 0.8) * 1.25;
    }
  };
}

function buildObject3D({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const parent = new THREE.Group();
  root.add(parent);
  const parentMesh = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.08, 16, 80), createStandardMaterial(0x5fc3ff, 0.35, 0.2));
  parent.add(parentMesh);

  const child = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), createStandardMaterial(accent.getHex(), 0.4, 0.5));
  child.castShadow = true;
  parent.add(child);

  const grandChild = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), createStandardMaterial(0xffd166, 0.3, 0.1));
  child.add(grandChild);

  root.add(makeLabel('父子层级：parent -> child -> grandChild', new THREE.Vector3(0, 2.35, 0)));

  return {
    apply(next) {
      child.position.x = Number(next.childOffset ?? 1.6);
      child.scale.setScalar(Number(next.childScale ?? 1));
      grandChild.position.set(0, Number(next.grandChildHeight ?? 0.85), 0);
      setFlag('childWorldX', Math.round(child.getWorldPosition(new THREE.Vector3()).x * 100) / 100);
    },
    tick(delta) {
      parent.rotation.y += delta * Number(values.parentRotation ?? 0.7);
      child.rotation.x += delta * 1.1;
    }
  };
}

function buildGeometry({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    new THREE.BoxGeometry(),
    createStandardMaterial(accent.getHex(), 0.55, 0.2)
  );
  mesh.castShadow = true;
  root.add(mesh);
  root.add(makePedestal());
  const normalHelper = new VertexNormalsHelper(mesh, 0.18, 0x92f7ff);
  root.add(normalHelper);

  function rebuild(next: Record<string, ControlValue>): void {
    const type = String(next.geometryType ?? 'torusKnot');
    const segments = Math.max(4, Number(next.segments ?? 32));
    mesh.geometry.dispose();

    if (type === 'sphere') {
      mesh.geometry = new THREE.SphereGeometry(1.15, segments, Math.max(8, Math.round(segments / 2)));
    } else if (type === 'plane') {
      mesh.geometry = new THREE.PlaneGeometry(2.6, 2.6, segments, segments);
      mesh.rotation.x = -Math.PI * 0.16;
    } else if (type === 'box') {
      mesh.geometry = new THREE.BoxGeometry(1.9, 1.9, 1.9, Math.max(1, Math.round(segments / 12)), Math.max(1, Math.round(segments / 12)), Math.max(1, Math.round(segments / 12)));
    } else {
      mesh.geometry = new THREE.TorusKnotGeometry(0.86, 0.24, segments * 3, Math.max(8, Math.round(segments / 3)));
    }

    twistGeometry(mesh.geometry, Number(next.twist ?? 0));
    mesh.geometry.computeVertexNormals();
    const material = mesh.material as THREE.MeshStandardMaterial;
    material.wireframe = Boolean(next.wireframe);
    normalHelper.visible = Boolean(next.showNormals);
    normalHelper.object = mesh;
    normalHelper.update();
    setFlag('geometryChanged', true);
    setFlag('vertexCount', mesh.geometry.attributes.position.count);
  }

  return {
    apply: rebuild,
    tick(delta) {
      mesh.rotation.y += delta * 0.38;
      normalHelper.update();
    },
    dispose() {
      normalHelper.dispose();
    }
  };
}

function buildMaterial({ root, scene, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const texture = createCheckerTexture();
  const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.Material>(
    new THREE.SphereGeometry(1.25, 64, 32),
    createStandardMaterial(accent.getHex(), 0.35, 0.6)
  );
  mesh.castShadow = true;
  root.add(mesh);
  root.add(makePedestal());

  const background = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.035, 12, 160), new THREE.MeshBasicMaterial({ color: 0x38566c }));
  background.rotation.x = Math.PI / 2;
  root.add(background);

  return {
    apply(next) {
      const color = new THREE.Color(String(next.materialColor ?? '#7dd3fc'));
      const type = String(next.materialType ?? 'standard');
      mesh.material.dispose();

      if (type === 'normal') {
        mesh.material = new THREE.MeshNormalMaterial({ wireframe: Boolean(next.materialWireframe) });
      } else if (type === 'basic') {
        mesh.material = new THREE.MeshBasicMaterial({ color, map: Boolean(next.textureEnabled) ? texture : null });
      } else {
        mesh.material = new THREE.MeshPhysicalMaterial({
          color,
          roughness: Number(next.roughness ?? 0.35),
          metalness: Number(next.metalness ?? 0.6),
          clearcoat: type === 'physical' ? 0.7 : 0,
          clearcoatRoughness: 0.2,
          envMapIntensity: Number(next.envIntensity ?? 1),
          map: Boolean(next.textureEnabled) ? texture : null
        });
      }

      scene.environmentIntensity = Number(next.envIntensity ?? 1);
      setFlag('usedPbrControls', Number(next.roughness ?? 0) !== 0.35 || Number(next.metalness ?? 0) !== 0.6);
    },
    tick(delta) {
      mesh.rotation.y += delta * 0.45;
      background.rotation.z += delta * 0.08;
    },
    dispose() {
      texture.dispose();
    }
  };
}

function buildLighting({ root, scene, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  scene.background = new THREE.Color(0x0b1118);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0x20313d, roughness: 0.8 }));
  floor.receiveShadow = true;
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.25;
  root.add(floor);

  const objects = [-1.8, 0, 1.8].map((x, index) => {
    const mesh = new THREE.Mesh(
      index === 1 ? new THREE.TorusKnotGeometry(0.58, 0.18, 100, 16) : new THREE.SphereGeometry(0.72, 42, 24),
      createStandardMaterial(index === 1 ? 0xffd166 : 0x7dd3fc, 0.45, index === 1 ? 0.5 : 0.05)
    );
    mesh.position.set(x, -0.25, 0);
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  });

  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.castShadow = true;
  key.position.set(2, 5, 3);
  key.shadow.mapSize.set(2048, 2048);
  root.add(key);

  const point = new THREE.PointLight(0x66e0ff, 3, 12);
  point.position.set(-3, 1.4, 2.4);
  root.add(point);
  root.add(new THREE.PointLightHelper(point, 0.18, 0x66e0ff));

  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  root.add(ambient);

  return {
    apply(next) {
      ambient.intensity = Number(next.ambientIntensity ?? 0.25);
      key.intensity = Number(next.keyIntensity ?? 2.5);
      key.position.y = Number(next.lightHeight ?? 5);
      key.color.set(String(next.lightColor ?? '#ffffff'));
      key.castShadow = Boolean(next.shadowEnabled);
      objects.forEach((object) => {
        object.castShadow = Boolean(next.shadowEnabled);
        object.receiveShadow = Boolean(next.shadowEnabled);
      });
      setFlag('shadowTuned', Boolean(next.shadowEnabled) && Number(next.keyIntensity ?? 0) > 1.5);
    },
    tick(delta, elapsed) {
      point.position.x = Math.sin(elapsed) * 3;
      objects.forEach((object, index) => {
        object.rotation.y += delta * (0.45 + index * 0.1);
      });
    }
  };
}

function buildCamera(services: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const { root, setCamera, setFlag } = services;
  const cameraHelperTarget = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), createStandardMaterial(0xffb703, 0.5, 0.2));
  cameraHelperTarget.castShadow = true;
  root.add(cameraHelperTarget);
  root.add(makePedestal());

  const frustumLabel = makeLabel('FOV / distance / projection 改的是“观察方式”，不是模型本身', new THREE.Vector3(0, 2.2, 0));
  root.add(frustumLabel);

  return {
    apply(next) {
      const projection = String(next.projection ?? 'perspective');
      if (projection === 'orthographic') {
        const ortho = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 250);
        ortho.position.set(0, 0, Number(next.cameraDistance ?? 7));
        setCamera(ortho);
      } else {
        const perspective = new THREE.PerspectiveCamera(Number(next.fov ?? 52), 1, 0.1, 250);
        perspective.position.set(0, 1.8, Number(next.cameraDistance ?? 7));
        perspective.updateProjectionMatrix();
        setCamera(perspective);
      }
      services.controls().target.set(0, 0, 0);
      services.controls().update();
      setFlag('projectionChanged', projection);
    },
    tick(delta) {
      cameraHelperTarget.rotation.x += delta * 0.45;
      cameraHelperTarget.rotation.y += delta * 0.8;
      if (Boolean(values.autoOrbit)) {
        const camera = services.camera();
        const radius = Number(values.cameraDistance ?? 7);
        const t = performance.now() * 0.0003;
        camera.position.set(Math.sin(t) * radius, 2.5, Math.cos(t) * radius);
        camera.lookAt(0, 0, 0);
      }
    }
  };
}

function buildInteraction(services: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const { root, renderer, camera, scene, setFlag } = services;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const items: THREE.Mesh[] = [];
  let selected: THREE.Mesh | undefined;

  for (let i = 0; i < 7; i += 1) {
    const mesh = new THREE.Mesh(
      i % 2 === 0 ? new THREE.BoxGeometry(0.7, 0.7, 0.7) : new THREE.SphereGeometry(0.42, 28, 18),
      createStandardMaterial(new THREE.Color().setHSL(i / 7, 0.72, 0.58).getHex(), 0.42, 0.2)
    );
    mesh.position.set((i - 3) * 0.82, Math.sin(i) * 0.55, Math.cos(i * 1.5) * 0.65);
    mesh.castShadow = true;
    mesh.name = `pickable-${i + 1}`;
    root.add(mesh);
    items.push(mesh);
  }

  const transform = new TransformControls(camera(), renderer.domElement);
  const transformHelper = transform.getHelper();
  transform.addEventListener('dragging-changed', (event) => {
    services.controls().enabled = !(event as { value: boolean }).value;
    setFlag('usedTransformControls', true);
  });
  scene.add(transformHelper);

  const onPointerMove = (event: PointerEvent): void => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  };

  const onClick = (): void => {
    raycaster.setFromCamera(pointer, camera());
    const hit = raycaster.intersectObjects(items, false)[0];
    if (!hit) {
      return;
    }
    selected = hit.object as THREE.Mesh;
    transform.attach(selected);
    setFlag('selectedObject', selected.name);
    setFlag('selectionCount', Number(services.root.userData.selectionCount ?? 0) + 1);
    services.root.userData.selectionCount = Number(services.root.userData.selectionCount ?? 0) + 1;
  };

  renderer.domElement.addEventListener('pointermove', onPointerMove);
  renderer.domElement.addEventListener('click', onClick);

  return {
    apply(next) {
      transform.setMode(String(next.transformMode ?? 'translate') as 'translate' | 'rotate' | 'scale');
      transform.setTranslationSnap(Boolean(next.snap) ? 0.25 : null);
      transform.setRotationSnap(Boolean(next.snap) ? THREE.MathUtils.degToRad(15) : null);
    },
    tick(delta) {
      raycaster.setFromCamera(pointer, camera());
      const hover = raycaster.intersectObjects(items, false)[0]?.object as THREE.Mesh | undefined;
      for (const item of items) {
        const material = item.material as THREE.MeshStandardMaterial;
        material.emissive.set(item === hover || item === selected ? String(values.highlightColor ?? '#22d3ee') : 0x000000);
        material.emissiveIntensity = item === hover || item === selected ? 0.45 : 0;
        item.rotation.y += delta * Number(values.hoverSpin ?? 0.45);
      }
    },
    dispose() {
      transform.dispose();
      scene.remove(transformHelper);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('click', onClick);
    }
  };
}

function buildAssets({ root, accent, setFlag, setStatus }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const holder = new THREE.Group();
  root.add(holder);
  root.add(makePedestal());
  const bounds = new THREE.BoxHelper(holder, 0x92f7ff);
  bounds.visible = false;
  root.add(bounds);

  function buildModel(): void {
    holder.clear();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.72, 0.9), createStandardMaterial(accent.getHex(), 0.32, 0.25));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), createStandardMaterial(0xffd166, 0.25, 0.15));
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.42), createStandardMaterial(0x9ae6b4, 0.5, 0.05));
    const rightWing = leftWing.clone();
    dome.position.y = 0.36;
    leftWing.position.set(-0.95, 0.02, 0);
    rightWing.position.set(0.95, 0.02, 0);
    holder.add(body, dome, leftWing, rightWing);
    holder.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
      }
    });
    setStatus('已加载运行时生成的 glTF 练习模型：这里模拟真实资产进入场景后的检查流程。');
    setFlag('hasLoadedModel', true);
  }

  buildModel();

  return {
    apply(next) {
      if (Boolean(next.loadModel)) {
        buildModel();
      }
      const variant = String(next.textureVariant ?? 'clean');
      holder.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const material = object.material as THREE.MeshStandardMaterial;
          material.roughness = variant === 'worn' ? 0.82 : 0.38;
          material.metalness = variant === 'metal' ? 0.9 : 0.15;
        }
      });
      bounds.visible = Boolean(next.showBounds);
      bounds.update();
      setFlag('checkedBounds', bounds.visible);
      setFlag('knowsCompression', Boolean(next.compressionNotes));
    },
    tick(delta) {
      holder.rotation.y += delta * Number(values.assetRotation ?? 0.45);
      holder.position.y = Math.sin(performance.now() * 0.0015) * 0.08;
      bounds.update();
    }
  };
}

function buildAnimation({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const rig = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.42), createStandardMaterial(accent.getHex(), 0.42, 0.2));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 18), createStandardMaterial(0xffd166, 0.36, 0.05));
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), createStandardMaterial(0x7dd3fc, 0.5, 0.08));
  const armR = armL.clone();
  head.position.y = 0.86;
  armL.position.set(-0.55, 0.1, 0);
  armR.position.set(0.55, 0.1, 0);
  rig.add(torso, head, armL, armR);
  root.add(rig);
  root.add(makePedestal());

  return {
    apply(next) {
      setFlag('animationAction', String(next.action ?? 'idle'));
      setFlag('timeScaleChanged', Number(next.timeScale ?? 1) !== 1);
    },
    tick(delta, elapsed) {
      const action = String(values.action ?? 'idle');
      const speed = Number(values.timeScale ?? 1);
      const blend = Number(values.blendWeight ?? 1);
      const t = elapsed * speed;
      rig.rotation.y += delta * 0.25;
      if (action === 'jump') {
        rig.position.y = Math.abs(Math.sin(t * 2.4)) * 0.8;
        armL.rotation.z = Math.sin(t * 2.4) * 0.6 * blend;
        armR.rotation.z = -Math.sin(t * 2.4) * 0.6 * blend;
      } else if (action === 'walk') {
        rig.position.y = Math.abs(Math.sin(t * 4)) * 0.08;
        armL.rotation.x = Math.sin(t * 4) * 0.75 * blend;
        armR.rotation.x = -Math.sin(t * 4) * 0.75 * blend;
      } else {
        rig.position.y = Math.sin(t * 1.6) * 0.08;
        armL.rotation.z = 0.15;
        armR.rotation.z = -0.15;
      }
    }
  };
}

function buildPostprocessing({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const group = new THREE.Group();
  root.add(group);
  for (let i = 0; i < 18; i += 1) {
    const material = new THREE.MeshStandardMaterial({
      color: i % 3 === 0 ? accent : new THREE.Color().setHSL(i / 18, 0.75, 0.58),
      emissive: i % 3 === 0 ? accent : 0x000000,
      emissiveIntensity: i % 3 === 0 ? 1.3 : 0.12,
      roughness: 0.35,
      metalness: 0.15
    });
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + (i % 4) * 0.05, 1), material);
    const angle = (i / 18) * Math.PI * 2;
    mesh.position.set(Math.cos(angle) * 2.1, Math.sin(i) * 0.7, Math.sin(angle) * 2.1);
    mesh.castShadow = true;
    group.add(mesh);
  }
  root.add(makeLabel('Bloom + Exposure 是成片阶段，不是模型变了', new THREE.Vector3(0, 2.35, 0)));

  return {
    apply(next) {
      setFlag('postProcessingEnabled', Boolean(next.bloomEnabled));
      setFlag('exposureChanged', Number(next.exposure ?? 1) !== 1);
    },
    tick(delta) {
      group.rotation.y += delta * Number(values.postSpin ?? 0.35);
    }
  };
}

function buildOptimization({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let crowd = new THREE.Group();
  root.add(crowd);

  function rebuild(next: Record<string, ControlValue>): void {
    root.remove(crowd);
    disposeObject(crowd);
    crowd = new THREE.Group();
    root.add(crowd);
    const count = Number(next.objectCount ?? 160);
    const useInstancing = Boolean(next.useInstancing);
    const geometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const material = createStandardMaterial(accent.getHex(), 0.55, 0.08);

    if (useInstancing) {
      const mesh = new THREE.InstancedMesh(geometry, material, count);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < count; i += 1) {
        placeCrowdItem(dummy, i, count);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      crowd.add(mesh);
    } else {
      for (let i = 0; i < count; i += 1) {
        const mesh = new THREE.Mesh(geometry.clone(), material.clone());
        placeCrowdItem(mesh, i, count);
        crowd.add(mesh);
      }
    }

    setFlag('usedInstancing', useInstancing);
    setFlag('objectCount', count);
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta) {
      if (Boolean(values.rotateCrowd)) {
        crowd.rotation.y += delta * 0.32;
      }
    }
  };
}

function buildShader({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const uniforms = {
    uTime: { value: 0 },
    uFrequency: { value: Number(values.frequency ?? 3) },
    uAmplitude: { value: Number(values.amplitude ?? 0.35) },
    uColorA: { value: accent.clone() },
    uColorB: { value: new THREE.Color(0xffd166) }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      uniform float uTime;
      uniform float uFrequency;
      uniform float uAmplitude;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        vUv = uv;
        vec3 transformed = position;
        float wave = sin((position.x + position.y) * uFrequency + uTime) * uAmplitude;
        transformed.z += wave;
        vWave = wave;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;
      varying float vWave;

      void main() {
        float mixValue = smoothstep(-0.4, 0.4, vWave) + vUv.x * 0.18;
        vec3 color = mix(uColorA, uColorB, mixValue);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3, 96, 72), material);
  mesh.rotation.x = -0.65;
  root.add(mesh);

  return {
    apply(next) {
      uniforms.uFrequency.value = Number(next.frequency ?? 3);
      uniforms.uAmplitude.value = Number(next.amplitude ?? 0.35);
      uniforms.uColorA.value.set(String(next.colorA ?? '#38bdf8'));
      uniforms.uColorB.value.set(String(next.colorB ?? '#ffd166'));
      setFlag('editedUniforms', true);
    },
    tick(delta, elapsed) {
      if (Boolean(values.animateShader)) {
        uniforms.uTime.value = elapsed;
      } else {
        uniforms.uTime.value += delta * 0.2;
      }
    }
  };
}

function buildLifecycle({ root, accent, renderer, setFlag, setStatus }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let pool = new THREE.Group();
  let disposedGeometries = 0;
  let disposedMaterials = 0;
  root.add(pool);
  root.add(makePedestal());

  function rebuild(next: Record<string, ControlValue>): void {
    pool.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        disposedGeometries += 1;
        const material = child.material;
        if (Array.isArray(material)) {
          material.forEach((item) => {
            item.dispose();
            disposedMaterials += 1;
          });
        } else {
          material.dispose();
          disposedMaterials += 1;
        }
      }
    });
    root.remove(pool);
    pool = new THREE.Group();
    root.add(pool);

    const count = Number(next.activeObjects ?? 18);
    const reuseMaterial = Boolean(next.reuseMaterial);
    const sharedMaterial = createStandardMaterial(accent.getHex(), Number(next.roughnessBudget ?? 0.55), 0.08);

    for (let i = 0; i < count; i += 1) {
      const geometry = i % 3 === 0 ? new THREE.SphereGeometry(0.18, 18, 12) : new THREE.BoxGeometry(0.3, 0.3, 0.3);
      const material = reuseMaterial ? sharedMaterial : createStandardMaterial(new THREE.Color().setHSL(i / count, 0.68, 0.58).getHex(), 0.55, 0.08);
      const mesh = new THREE.Mesh(geometry, material);
      const angle = i * 0.72;
      const radius = 0.6 + (i % 9) * 0.18;
      mesh.position.set(Math.cos(angle) * radius, Math.sin(i * 0.7) * 0.55, Math.sin(angle) * radius);
      mesh.castShadow = true;
      pool.add(mesh);
    }

    if (reuseMaterial) {
      setFlag('sharedMaterialStrategy', true);
    }
    setFlag('disposedGeometries', disposedGeometries);
    setFlag('disposedMaterials', disposedMaterials);
    setStatus(`生命周期演示：已重建对象池，renderer.info 当前 geometries=${renderer.info.memory.geometries}，textures=${renderer.info.memory.textures}。`);
  }

  rebuild(values);

  return {
    apply(next) {
      rebuild(next);
      setFlag('lifecycleAudited', Boolean(next.auditDispose));
    },
    tick(delta) {
      pool.rotation.y += delta * Number(values.poolSpin ?? 0.35);
    }
  };
}

function buildProcedural({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let city = new THREE.Group();
  root.add(city);

  function rebuild(next: Record<string, ControlValue>): void {
    root.remove(city);
    disposeObject(city);
    city = new THREE.Group();
    root.add(city);

    const density = Number(next.cityDensity ?? 9);
    const heightScale = Number(next.heightScale ?? 1.2);
    const streetWidth = Number(next.streetWidth ?? 0.18);
    const materialMode = String(next.materialMode ?? 'mixed');
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x20252b, roughness: 0.8 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.24;
    ground.receiveShadow = true;
    city.add(ground);

    const shared = createStandardMaterial(accent.getHex(), 0.48, 0.12);
    let buildings = 0;
    for (let x = 0; x < density; x += 1) {
      for (let z = 0; z < density; z += 1) {
        if (x % 3 === 1 && z % 4 === 1) {
          continue;
        }
        const h = 0.25 + seededWave(x, z) * heightScale;
        const width = Math.max(0.12, 0.52 - streetWidth);
        const geometry = new THREE.BoxGeometry(width, h, width);
        const material = materialMode === 'shared'
          ? shared
          : createStandardMaterial(new THREE.Color().setHSL(0.5 + h * 0.08, 0.42, 0.45 + h * 0.08).getHex(), 0.55, 0.08);
        const building = new THREE.Mesh(geometry, material);
        building.position.set((x - density / 2) * 0.68, -1.24 + h / 2, (z - density / 2) * 0.68);
        building.castShadow = true;
        building.receiveShadow = true;
        city.add(building);
        buildings += 1;
      }
    }

    setFlag('proceduralBuilt', buildings);
    setFlag('usedSharedProceduralMaterial', materialMode === 'shared');
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta) {
      city.rotation.y += delta * Number(values.citySpin ?? 0.12);
    }
  };
}

function buildParticles({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.PointsMaterial({
    size: Number(values.pointSize ?? 0.045),
    color: accent,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.86,
    depthWrite: false
  });
  const points = new THREE.Points(geometry, material);
  root.add(points);

  function rebuild(next: Record<string, ControlValue>): void {
    const count = Number(next.particleAmount ?? 1200);
    const spread = Number(next.particleSpread ?? 3.2);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const radius = Math.sqrt(i / count) * spread;
      const angle = i * 2.399963;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.9;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      color.setHSL((i / count + 0.52) % 1, 0.75, 0.55);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    material.vertexColors = Boolean(next.vertexColors);
    material.size = Number(next.pointSize ?? 0.045);
    material.needsUpdate = true;
    setFlag('particleCount', count);
    setFlag('usesVertexColors', Boolean(next.vertexColors));
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta, elapsed) {
      const position = geometry.attributes.position as THREE.BufferAttribute | undefined;
      if (position && Boolean(values.animateParticles)) {
        for (let i = 0; i < position.count; i += 1) {
          const x = position.getX(i);
          const z = position.getZ(i);
          position.setY(i, Math.sin(elapsed * 1.6 + x * 2.2 + z * 1.5) * Number(values.waveHeight ?? 0.35));
        }
        position.needsUpdate = true;
      }
      points.rotation.y += delta * 0.18;
    }
  };
}

function buildRenderTarget({ renderer, root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const target = new THREE.WebGLRenderTarget(512, 512, { colorSpace: THREE.SRGBColorSpace });
  const miniScene = new THREE.Scene();
  miniScene.background = new THREE.Color(0x08111a);
  const miniCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  miniCamera.position.set(0, 0, 4);
  const miniMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.85, 0.25, 120, 18), createStandardMaterial(accent.getHex(), 0.32, 0.35));
  miniScene.add(miniMesh, new THREE.AmbientLight(0xffffff, 1.8));

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(4.2, 2.7),
    new THREE.MeshBasicMaterial({ map: target.texture })
  );
  screen.position.y = 0.15;
  root.add(screen);
  root.add(makeLabel('RenderTarget：先渲染到纹理，再把纹理贴回主场景', new THREE.Vector3(0, 2.25, 0)));

  return {
    apply(next) {
      const resolution = Number(next.targetResolution ?? 512);
      target.setSize(resolution, resolution);
      const material = screen.material as THREE.MeshBasicMaterial;
      material.wireframe = Boolean(next.showTargetGrid);
      setFlag('renderTargetResolution', resolution);
      setFlag('usedRenderTarget', true);
    },
    tick(delta) {
      miniMesh.rotation.x += delta * Number(values.targetSpin ?? 0.7);
      miniMesh.rotation.y += delta * 1.1;
      renderer.setRenderTarget(target);
      renderer.render(miniScene, miniCamera);
      renderer.setRenderTarget(null);
    },
    dispose() {
      target.dispose();
      disposeObject(miniScene);
    }
  };
}

function buildShaderNoise({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const uniforms = {
    uTime: { value: 0 },
    uScale: { value: Number(values.noiseScale ?? 3.5) },
    uContrast: { value: Number(values.noiseContrast ?? 1.2) },
    uColorA: { value: accent.clone() },
    uColorB: { value: new THREE.Color(0xfbbf24) }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uScale;
      uniform float uContrast;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }

      void main() {
        float n = noise(vUv * uScale + vec2(uTime * 0.12, -uTime * 0.08));
        n = smoothstep(0.18, 0.86, n * uContrast);
        gl_FragColor = vec4(mix(uColorA, uColorB, n), 1.0);
      }
    `,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3, 1, 1), material);
  root.add(mesh);

  return {
    apply(next) {
      uniforms.uScale.value = Number(next.noiseScale ?? 3.5);
      uniforms.uContrast.value = Number(next.noiseContrast ?? 1.2);
      uniforms.uColorA.value.set(String(next.noiseColorA ?? '#38bdf8'));
      uniforms.uColorB.value.set(String(next.noiseColorB ?? '#fbbf24'));
      setFlag('editedNoiseUniforms', true);
    },
    tick(_delta, elapsed) {
      uniforms.uTime.value = Boolean(values.animateNoise) ? elapsed : 0;
    }
  };
}

function buildCameraPath(services: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const { root, camera, controls, setFlag } = services;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4, 1.7, 4),
    new THREE.Vector3(1.2, 3.2, 5),
    new THREE.Vector3(-4, 2.2, 2.6),
    new THREE.Vector3(-3, 1.2, -4),
    new THREE.Vector3(3.5, 2.6, -3.2)
  ], true);
  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(120)),
    new THREE.LineBasicMaterial({ color: 0x7dd3fc })
  );
  root.add(path);
  root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), createStandardMaterial(0xffd166, 0.4, 0.18)));
  root.add(makePedestal());

  return {
    apply(next) {
      path.visible = Boolean(next.showCameraPath);
      setFlag('cameraPathVisible', path.visible);
      setFlag('cameraPathMode', String(next.pathMode ?? 'orbit'));
    },
    tick(_delta, elapsed) {
      if (!Boolean(values.playCameraPath)) {
        return;
      }
      const progress = (elapsed * Number(values.pathSpeed ?? 0.08)) % 1;
      const point = curve.getPointAt(progress);
      const look = curve.getPointAt((progress + 0.025) % 1);
      camera().position.copy(point);
      camera().lookAt(String(values.pathMode ?? 'orbit') === 'lookAhead' ? look : new THREE.Vector3(0, 0, 0));
      controls().target.set(0, 0, 0);
      controls().update();
    }
  };
}

function buildWorld({ root, scene, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let world = new THREE.Group();
  root.add(world);
  scene.fog = new THREE.Fog(0x10151d, 8, 24);

  function rebuild(next: Record<string, ControlValue>): void {
    root.remove(world);
    disposeObject(world);
    world = new THREE.Group();
    root.add(world);
    const chunks = Number(next.chunkRadius ?? 3);
    const useLod = Boolean(next.useLod);
    const detail = Number(next.terrainDetail ?? 12);

    for (let x = -chunks; x <= chunks; x += 1) {
      for (let z = -chunks; z <= chunks; z += 1) {
        const distance = Math.max(Math.abs(x), Math.abs(z));
        const segments = useLod ? Math.max(1, detail - distance * 3) : detail;
        const geometry = new THREE.PlaneGeometry(1.8, 1.8, segments, segments);
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i += 1) {
          const wx = position.getX(i) + x * 1.8;
          const wz = position.getY(i) + z * 1.8;
          position.setZ(i, Math.sin(wx * 1.4) * Math.cos(wz * 1.2) * 0.16);
        }
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
          color: new THREE.Color(accent).lerp(new THREE.Color(0x27313d), distance / Math.max(1, chunks)).getHex(),
          roughness: 0.86
        }));
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(x * 1.8, -1.1, z * 1.8);
        mesh.receiveShadow = true;
        world.add(mesh);
      }
    }

    setFlag('worldChunks', world.children.length);
    setFlag('lodEnabled', useLod);
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta) {
      world.rotation.y += delta * Number(values.worldSpin ?? 0.06);
    },
    dispose() {
      scene.fog = null;
    }
  };
}

function buildHud({ root, camera, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const anchors: Array<{ mesh: THREE.Mesh; label: THREE.Sprite }> = [];
  for (let i = 0; i < 5; i += 1) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 14), createStandardMaterial(new THREE.Color().setHSL(i / 5, 0.7, 0.58).getHex(), 0.42, 0.08));
    mesh.position.set((i - 2) * 0.9, Math.sin(i) * 0.42, Math.cos(i * 1.2) * 0.9);
    mesh.castShadow = true;
    const label = makeLabel(`POI ${i + 1}`, new THREE.Vector3());
    label.scale.set(1.2, 0.2, 1);
    root.add(mesh, label);
    anchors.push({ mesh, label });
  }

  return {
    apply(next) {
      const visible = Boolean(next.showLabels);
      anchors.forEach(({ label }) => {
        label.visible = visible;
        label.scale.setScalar(Number(next.labelScale ?? 1));
        label.scale.y *= 0.18;
      });
      setFlag('labelsVisible', visible);
      setFlag('occlusionExplained', Boolean(next.fakeOcclusion));
    },
    tick(delta) {
      anchors.forEach(({ mesh, label }, index) => {
        mesh.rotation.y += delta * (0.4 + index * 0.08);
        label.position.copy(mesh.position).add(new THREE.Vector3(0, 0.52, 0));
        label.lookAt(camera().position);
        if (Boolean(values.fakeOcclusion)) {
          label.material.opacity = mesh.position.z < 0 ? 0.35 : 1;
        }
      });
    }
  };
}

function buildProduct({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const product = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.92, 1.55, 64), createStandardMaterial(accent.getHex(), 0.24, 0.55));
  const cap = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.08, 16, 80), createStandardMaterial(0xffffff, 0.18, 0.75));
  const label = makeLabel('PRODUCT', new THREE.Vector3(0, 0.08, 0.82));
  label.scale.set(1.45, 0.22, 1);
  product.add(body, cap, label);
  cap.position.y = 0.82;
  product.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
    }
  });
  root.add(product, makePedestal());

  return {
    apply(next) {
      const material = body.material as THREE.MeshStandardMaterial;
      material.color.set(String(next.productColor ?? '#38bdf8'));
      material.roughness = Number(next.productRoughness ?? 0.24);
      material.metalness = Number(next.productMetalness ?? 0.55);
      label.visible = Boolean(next.showBrandLabel);
      setFlag('productLookTuned', Number(next.productMetalness ?? 0) > 0.7 || Number(next.productRoughness ?? 1) < 0.25);
    },
    tick(delta) {
      if (Boolean(values.turntable)) {
        product.rotation.y += delta * Number(values.turntableSpeed ?? 0.5);
      }
    }
  };
}

function buildDataViz({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  let chart = new THREE.Group();
  root.add(chart);

  function rebuild(next: Record<string, ControlValue>): void {
    root.remove(chart);
    disposeObject(chart);
    chart = new THREE.Group();
    root.add(chart);
    const count = Number(next.barCount ?? 24);
    const threshold = Number(next.threshold ?? 0.25);
    const layout = String(next.chartLayout ?? 'grid');
    let visibleBars = 0;

    for (let i = 0; i < count; i += 1) {
      const value = 0.12 + Math.abs(Math.sin(i * 1.73)) * 1.65;
      if (value < threshold) {
        continue;
      }
      const geometry = new THREE.BoxGeometry(0.22, value, 0.22);
      const color = new THREE.Color(accent).lerp(new THREE.Color(0xffd166), value / 1.8);
      const bar = new THREE.Mesh(geometry, createStandardMaterial(color.getHex(), 0.5, 0.06));
      if (layout === 'radial') {
        const angle = (i / count) * Math.PI * 2;
        bar.position.set(Math.cos(angle) * 1.8, -1.2 + value / 2, Math.sin(angle) * 1.8);
        bar.lookAt(0, bar.position.y, 0);
      } else {
        bar.position.set((i % 8 - 3.5) * 0.38, -1.2 + value / 2, (Math.floor(i / 8) - 1.5) * 0.48);
      }
      bar.castShadow = true;
      chart.add(bar);
      visibleBars += 1;
    }

    setFlag('visibleBars', visibleBars);
    setFlag('radialChart', layout === 'radial');
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta) {
      chart.rotation.y += delta * Number(values.chartSpin ?? 0.2);
    }
  };
}

function buildPortfolio({ root, accent, setFlag }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const group = new THREE.Group();
  root.add(group);
  const panels: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.56, 0.06),
      createStandardMaterial(new THREE.Color().setHSL(0.52 + i * 0.08, 0.58, 0.52).getHex(), 0.4, 0.18)
    );
    panel.position.set((i - 2.5) * 0.72, Math.sin(i * 0.8) * 0.36, Math.cos(i * 0.8) * 0.52);
    panel.castShadow = true;
    panels.push(panel);
    group.add(panel);
  }
  group.add(new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.12, 90, 14), createStandardMaterial(accent.getHex(), 0.25, 0.45)));
  root.add(makeLabel('Capstone：把模型、灯光、交互、优化、叙事整合成作品', new THREE.Vector3(0, 2.35, 0)));

  return {
    apply(next) {
      const mode = String(next.capstoneMode ?? 'gallery');
      panels.forEach((panel, index) => {
        if (mode === 'caseStudy') {
          panel.position.set(Math.cos(index / panels.length * Math.PI * 2) * 1.7, Math.sin(index * 0.7) * 0.3, Math.sin(index / panels.length * Math.PI * 2) * 1.7);
        } else if (mode === 'landing') {
          panel.position.set((index - 2.5) * 0.62, 0.15 * Math.sin(index), -Math.abs(index - 2.5) * 0.18);
        } else {
          panel.position.set((index - 2.5) * 0.72, Math.sin(index * 0.8) * 0.36, Math.cos(index * 0.8) * 0.52);
        }
      });
      setFlag('capstoneMode', mode);
      setFlag('projectChecklistDone', Boolean(next.projectChecklist));
    },
    tick(delta) {
      group.rotation.y += delta * Number(values.portfolioSpin ?? 0.22);
    }
  };
}

function buildPhysics({ root, accent, setFlag, setStatus }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const balls: THREE.Mesh[] = [];
  const velocities: THREE.Vector3[] = [];
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.18, 6), createStandardMaterial(0x20313d, 0.8, 0));
  floor.position.y = -1.25;
  floor.receiveShadow = true;
  root.add(floor);

  let rapierLoadStarted = false;
  setStatus('物理课先使用轻量 fallback 模拟；点击生成或重置时会按需加载 Rapier WASM。');
  setFlag('rapierReady', false);

  function ensureRapier(): void {
    if (rapierLoadStarted) {
      return;
    }

    rapierLoadStarted = true;
    void import('@dimforge/rapier3d-compat')
      .then(async (rapier) => {
        await rapier.init();
        setStatus('Rapier WASM 已加载；当前画面继续用轻量可视化模拟讲解刚体核心概念。');
        setFlag('rapierReady', true);
      })
      .catch(() => {
        setStatus('Rapier 加载失败，继续使用浏览器内置简化模拟；概念仍可学习。');
        setFlag('rapierReady', false);
      });
  }

  function spawn(): void {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22 + Math.random() * 0.18, 28, 16), createStandardMaterial(accent.getHex(), 0.42, 0.15));
    mesh.position.set((Math.random() - 0.5) * 2.2, 2.2 + Math.random(), (Math.random() - 0.5) * 2.2);
    mesh.castShadow = true;
    root.add(mesh);
    balls.push(mesh);
    velocities.push(new THREE.Vector3((Math.random() - 0.5) * 0.8, 0, (Math.random() - 0.5) * 0.8));
    setFlag('spawnedBodies', balls.length);
  }

  for (let i = 0; i < 6; i += 1) {
    spawn();
  }

  return {
    apply(next) {
      if (Boolean(next.spawnBall)) {
        ensureRapier();
        spawn();
      }
      if (Boolean(next.resetPhysics)) {
        ensureRapier();
        balls.forEach((ball) => ball.position.y = 2 + Math.random());
        velocities.forEach((velocity) => velocity.set(0, 0, 0));
        setFlag('resetPhysics', true);
      }
    },
    tick(delta) {
      const gravity = Number(values.gravity ?? -9.8);
      const restitution = Number(values.restitution ?? 0.72);
      balls.forEach((ball, index) => {
        const velocity = velocities[index];
        velocity.y += gravity * delta;
        ball.position.addScaledVector(velocity, delta);
        if (ball.position.y < -0.85) {
          ball.position.y = -0.85;
          velocity.y = Math.abs(velocity.y) * restitution;
          velocity.x *= 0.98;
          velocity.z *= 0.98;
        }
        ball.rotation.x += velocity.z * delta;
        ball.rotation.z -= velocity.x * delta;
      });
    }
  };
}

function buildWebXR({ root, setFlag, setStatus }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const headset = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.42), createStandardMaterial(0x111827, 0.35, 0.25));
  const lensL = new THREE.Mesh(new THREE.CircleGeometry(0.18, 28), new THREE.MeshBasicMaterial({ color: 0x67e8f9 }));
  const lensR = lensL.clone();
  lensL.position.set(-0.32, 0, 0.22);
  lensR.position.set(0.32, 0, 0.22);
  headset.add(body, lensL, lensR);
  root.add(headset);

  const controllerLines = new THREE.Group();
  root.add(controllerLines);
  for (const x of [-0.8, 0.8]) {
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -0.4, 0.5), new THREE.Vector3(x, -0.4, -2.4)]),
      new THREE.LineBasicMaterial({ color: 0x7dd3fc })
    );
    controllerLines.add(line);
  }

  setStatus('WebXR 会根据浏览器和设备支持情况启用；这里默认展示安全 fallback。');
  setFlag('webxrFallbackVisible', true);

  return {
    apply(next) {
      controllerLines.visible = Boolean(next.simulateControllers);
      headset.scale.setScalar(Boolean(next.headsetView) ? 1.25 : 1);
      setFlag('simulatedXrControls', controllerLines.visible);
    },
    tick(delta) {
      headset.rotation.y += delta * 0.35;
      headset.position.y = Math.sin(performance.now() * 0.0015) * 0.08;
    }
  };
}

function buildWebGPU({ root, accent, setFlag, setStatus }: SceneServices, values: Record<string, ControlValue>): LessonSceneController {
  const group = new THREE.Group();
  root.add(group);

  const webgpuAvailable = 'gpu' in navigator;
  setStatus(webgpuAvailable ? '检测到 navigator.gpu：可继续学习 WebGPU 渲染管线概念。' : '当前浏览器没有暴露 navigator.gpu，已用 WebGL 可视化 WebGPU 管线概念。');
  setFlag('webgpuFallbackVisible', !webgpuAvailable);

  function rebuild(next: Record<string, ControlValue>): void {
    group.clear();
    const count = Number(next.particleCount ?? 220);
    const geometry = new THREE.SphereGeometry(0.035, 10, 8);
    const material = new THREE.MeshBasicMaterial({ color: accent });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const angle = i * 0.34;
      const radius = 0.5 + (i % 40) * 0.045;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(i * 0.2) * 0.5, Math.sin(angle) * radius);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
    setFlag('pipelineMode', String(next.pipelineMode ?? 'render'));
    setFlag('webgpuParticleCount', count);
  }

  rebuild(values);

  return {
    apply: rebuild,
    tick(delta) {
      group.rotation.y += delta * (Boolean(values.computeLike) ? 0.75 : 0.35);
    }
  };
}

function createOrbitControls(camera: THREE.Camera, domElement: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}

function createStandardMaterial(color: number, roughness: number, metalness: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makePedestal(): THREE.Mesh {
  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 2.1, 0.28, 48),
    new THREE.MeshStandardMaterial({ color: 0x1e2a36, roughness: 0.75, metalness: 0.05 })
  );
  pedestal.position.y = -1.18;
  pedestal.receiveShadow = true;
  return pedestal;
}

function createCheckerTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#7dd3fc' : '#0f172a';
        ctx.fillRect(x * 32, y * 32, 32, 32);
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function makeLabel(text: string, position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    roundRect(ctx, 24, 24, 976, 112, 24);
    ctx.fill();
    ctx.fillStyle = '#e5f4ff';
    ctx.font = '42px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, 82);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.position.copy(position);
  sprite.scale.set(4.2, 0.66, 1);
  return sprite;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function twistGeometry(geometry: THREE.BufferGeometry, amount: number): void {
  const position = geometry.attributes.position;
  const vector = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    vector.fromBufferAttribute(position, i);
    const angle = vector.y * amount;
    const x = vector.x * Math.cos(angle) - vector.z * Math.sin(angle);
    const z = vector.x * Math.sin(angle) + vector.z * Math.cos(angle);
    position.setXYZ(i, x, vector.y, z);
  }
  position.needsUpdate = true;
}

function placeCrowdItem(object: THREE.Object3D, index: number, count: number): void {
  const side = Math.ceil(Math.sqrt(count));
  const x = (index % side) - side / 2;
  const z = Math.floor(index / side) - side / 2;
  object.position.set(x * 0.28, Math.sin(index * 0.4) * 0.2, z * 0.28);
  object.rotation.set(index * 0.07, index * 0.11, 0);
}

function seededWave(...values: number[]): number {
  const x = values[0] ?? 0;
  const z = values[1] ?? 0;
  const seed = values[2] ?? 1;
  const frequency = values[3] ?? 1;
  const phase = values[4] ?? 0;
  const base = Math.sin((x * 12.9898 + z * 78.233 + seed * 37.719 + phase) * frequency);
  const detail = Math.sin((x * 4.31 - z * 9.17 + seed * 11.13 + phase * 0.37) * frequency * 1.7);
  return base * 0.72 + detail * 0.28;
}

function readMetrics(renderer: THREE.WebGLRenderer, root: THREE.Object3D, fps: number): LessonMetrics {
  return {
    fps,
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    objects: countObjects(root)
  };
}

function countObjects(root: THREE.Object3D): number {
  let count = 0;
  root.traverse(() => {
    count += 1;
  });
  return count;
}

function emptyMetrics(): LessonMetrics {
  return {
    fps: 0,
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    objects: 0
  };
}

function disposeObject(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite) {
      const maybeMesh = child as THREE.Mesh | THREE.Line | THREE.Sprite;
      if ('geometry' in maybeMesh && maybeMesh.geometry) {
        maybeMesh.geometry.dispose();
      }
      const material = maybeMesh.material;
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else if (material) {
        disposeMaterial(material);
      }
    }
  });
}

function disposeMaterial(material: THREE.Material): void {
  Object.values(material as unknown as Record<string, unknown>).forEach((value) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}
