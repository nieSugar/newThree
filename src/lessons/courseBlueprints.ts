import type { ExerciseSpec, LabControl, LessonKind, LessonMeta, LessonNarrative } from '../types';

export interface LessonBlueprint {
  kind: LessonKind;
  accent: number;
  meta: LessonMeta;
  narrative: LessonNarrative;
  controls: LabControl[];
  exercises: ExerciseSpec[];
  source: string;
}

const range = (id: string, label: string, defaultValue: number, min: number, max: number, step: number, help: string, unit = ''): LabControl => ({
  id,
  label,
  kind: 'range',
  defaultValue,
  min,
  max,
  step,
  unit,
  help
});

const toggle = (id: string, label: string, defaultValue: boolean, help: string): LabControl => ({
  id,
  label,
  kind: 'toggle',
  defaultValue,
  help
});

const color = (id: string, label: string, defaultValue: string, help: string): LabControl => ({
  id,
  label,
  kind: 'color',
  defaultValue,
  help
});

const button = (id: string, label: string, help: string): LabControl => ({
  id,
  label,
  kind: 'button',
  defaultValue: false,
  help
});

const select = (
  id: string,
  label: string,
  defaultValue: string,
  help: string,
  options: Array<[string, string]>
): LabControl => ({
  id,
  label,
  kind: 'select',
  defaultValue,
  help,
  options: options.map(([value, optionLabel]) => ({ value, label: optionLabel }))
});

export const lessonBlueprints: LessonBlueprint[] = [
  {
    kind: 'foundation',
    accent: 0x38bdf8,
    meta: {
      id: 'foundation-scene-camera-renderer',
      title: '01. 场景、相机、渲染器',
      stage: '入门',
      difficulty: '小白友好',
      estimatedMinutes: 18,
      summary: '用一个可调物体理解 Three.js 最小闭环：Scene + Camera + Renderer + Mesh + Animation Loop。',
      tags: ['scene', 'camera', 'renderer', 'mesh'],
      terms: ['scene', 'camera', 'renderer', 'mesh', 'animation-loop', 'delta-time']
    },
    narrative: {
      overview: 'Three.js 入门不是背 API，而是先把“舞台、镜头、画笔、演员、每帧更新”这条链路跑通。',
      mentalModel: 'scene 像舞台，camera 像观众眼睛，renderer 像摄影机把结果画到 canvas，mesh 是舞台上的演员。',
      keyPoints: [
        '每帧渲染前更新物体状态，动画才会动。',
        'renderer 的 pixelRatio 会影响清晰度和性能。',
        'mesh = geometry + material，形状和表面是两件事。'
      ],
      commonMistakes: [
        '只创建对象但不 add 到 scene。',
        '窗口尺寸变了但 camera.aspect 和 renderer size 没更新。',
        '动画速度没有乘 delta time。'
      ]
    },
    controls: [
      select('shape', '几何形状', 'box', '切换 geometry，观察同一个 mesh 如何换形状。', [['box', 'Box'], ['sphere', 'Sphere'], ['torus', 'Torus Knot']]),
      range('speed', '旋转速度', 0.8, 0, 3, 0.05, '动画循环中每秒旋转的速度。'),
      range('scale', '缩放', 1, 0.4, 2.2, 0.05, 'Object3D.scale 会统一影响子对象变换。'),
      toggle('wireframe', '线框模式', false, '看清几何体三角面结构。'),
      toggle('showAxes', '显示坐标轴', true, '红 X、绿 Y、蓝 Z，先把方向感建立起来。')
    ],
    exercises: [
      {
        id: 'foundation-change-shape',
        title: '换一次形状',
        goal: '把形状从 Box 切到 Sphere 或 Torus，理解 Mesh 可以复用材质并替换 Geometry。',
        hint: '使用“几何形状”下拉框。',
        checks: [{ source: 'flag', key: 'changedShape', op: 'truthy' }]
      },
      {
        id: 'foundation-wire-scale',
        title: '拆开看结构',
        goal: '打开线框模式，并把缩放调到 1.4 以上。',
        hint: 'Wireframe 能帮你看到三角面，Scale 能帮你确认变换不是改顶点数据。',
        checks: [
          { source: 'control', key: 'wireframe', op: 'truthy' },
          { source: 'control', key: 'scale', op: 'gte', value: 1.4 }
        ]
      }
    ],
    source: `const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, width / height, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function animate(delta) {
  mesh.rotation.y += delta * speed;
  renderer.render(scene, camera);
}`
  },
  {
    kind: 'object3d',
    accent: 0xa78bfa,
    meta: {
      id: 'object3d-transform-hierarchy',
      title: '02. Object3D 与父子变换',
      stage: '核心',
      difficulty: '小白友好',
      estimatedMinutes: 22,
      summary: '理解 position、rotation、scale、父子层级、世界坐标和本地坐标。',
      tags: ['Object3D', 'transform', 'matrix'],
      terms: ['object3d', 'vector3', 'euler', 'quaternion', 'matrix4']
    },
    narrative: {
      overview: 'Three.js 的场景图是层级结构。子对象不是“独立漂着”，它会继承父对象的变换。',
      mentalModel: '父对象像托盘，托盘旋转时，托盘上的杯子也一起转；杯子自己的旋转还会叠加上去。',
      keyPoints: [
        'position 是本地坐标，不一定等于世界坐标。',
        'rotation 通常用 Euler 调参，复杂插值要理解 Quaternion。',
        'matrixWorld 是父子变换叠加后的结果。'
      ],
      commonMistakes: [
        '把子对象的 position 当世界坐标使用。',
        '旋转顺序和单位搞错，Three.js 默认用弧度。',
        '模型层级很深时没用 getWorldPosition 排查。'
      ]
    },
    controls: [
      range('parentRotation', '父级旋转速度', 0.7, 0, 2, 0.05, '父级 Group 旋转会带动所有子对象。'),
      range('childOffset', '子对象偏移', 1.6, 0.4, 2.8, 0.05, '改变 child.position.x，观察轨道半径变化。'),
      range('childScale', '子对象缩放', 1, 0.4, 2, 0.05, '缩放 child 后，grandChild 会一起受影响。'),
      range('grandChildHeight', '孙对象高度', 0.85, 0.3, 1.6, 0.05, '调整孙对象的本地 Y 坐标。'),
      toggle('showAxes', '显示坐标轴', true, '用坐标轴辅助判断世界方向。')
    ],
    exercises: [
      {
        id: 'object3d-child-offset',
        title: '拉开子对象',
        goal: '把子对象偏移调到 2.2 以上，观察世界位置变化。',
        hint: '父级还在转，子对象本地 X 变大后轨道半径也变大。',
        checks: [{ source: 'control', key: 'childOffset', op: 'gte', value: 2.2 }]
      },
      {
        id: 'object3d-scale-chain',
        title: '验证缩放继承',
        goal: '把子对象缩放调到 1.5 以上，观察孙对象也变大。',
        hint: '子对象缩放会影响它自己的所有 child。',
        checks: [{ source: 'control', key: 'childScale', op: 'gte', value: 1.5 }]
      }
    ],
    source: `const parent = new THREE.Group();
const child = new THREE.Mesh(geometry, material);
const grandChild = new THREE.Mesh(smallGeometry, smallMaterial);

parent.add(child);
child.add(grandChild);
scene.add(parent);

parent.rotation.y += delta;
child.position.x = childOffset;
child.getWorldPosition(worldPosition);`
  },
  {
    kind: 'geometry',
    accent: 0x22c55e,
    meta: {
      id: 'geometry-buffer-attributes',
      title: '03. BufferGeometry 与顶点属性',
      stage: '核心',
      difficulty: '进阶',
      estimatedMinutes: 28,
      summary: '观察顶点数量、分段、法线和几何变形，建立 BufferGeometry 的底层认识。',
      tags: ['geometry', 'attribute', 'normal', 'wireframe'],
      terms: ['buffergeometry', 'attribute', 'normal', 'uv', 'mesh']
    },
    narrative: {
      overview: '所有复杂模型最终都落到顶点、索引、法线、UV 这些数据上。',
      mentalModel: 'Geometry 是一张点线面的数据表，renderer 按这些数据把三角形交给 GPU。',
      keyPoints: [
        'segments 越高，顶点越多，形状更细但成本更高。',
        'normal 决定表面如何接收光照。',
        'wireframe 能暴露模型拓扑，适合排查破面。'
      ],
      commonMistakes: [
        '以为模型越圆越好，忘了移动端顶点预算。',
        '手改 position 后忘记 computeVertexNormals。',
        '贴图错位时只怪图片，没检查 UV。'
      ]
    },
    controls: [
      select('geometryType', '几何体', 'torusKnot', '切换不同 BufferGeometry。', [['torusKnot', 'TorusKnot'], ['sphere', 'Sphere'], ['box', 'Box'], ['plane', 'Plane']]),
      range('segments', '分段数量', 32, 4, 96, 1, '分段越多，顶点和三角面越多。'),
      range('twist', '扭曲强度', 0, -2, 2, 0.05, '直接修改 position attribute，观察几何变形。'),
      toggle('wireframe', '线框', false, '显示三角面结构。'),
      toggle('showNormals', '显示法线', false, '显示每个顶点附近的法线方向。')
    ],
    exercises: [
      {
        id: 'geometry-high-segments',
        title: '提高细分',
        goal: '把分段数量调到 64 以上，观察顶点数量和画面变化。',
        hint: '右侧性能面板里会显示 triangles。',
        checks: [{ source: 'control', key: 'segments', op: 'gte', value: 64 }]
      },
      {
        id: 'geometry-normal-wireframe',
        title: '看清拓扑和法线',
        goal: '打开线框和法线显示。',
        hint: '法线箭头会告诉你表面朝向。',
        checks: [
          { source: 'control', key: 'wireframe', op: 'truthy' },
          { source: 'control', key: 'showNormals', op: 'truthy' }
        ]
      }
    ],
    source: `const geometry = new THREE.TorusKnotGeometry(0.86, 0.24, tubularSegments, radialSegments);
const position = geometry.attributes.position;

for (let i = 0; i < position.count; i++) {
  vertex.fromBufferAttribute(position, i);
  // 修改顶点坐标后要标记更新
  position.setXYZ(i, vertex.x, vertex.y, vertex.z);
}

position.needsUpdate = true;
geometry.computeVertexNormals();`
  },
  {
    kind: 'material',
    accent: 0xf97316,
    meta: {
      id: 'material-pbr-texture',
      title: '04. 材质、PBR 与纹理',
      stage: '效果',
      difficulty: '进阶',
      estimatedMinutes: 30,
      summary: '用粗糙度、金属度、环境强度和程序贴图理解 PBR 材质调效果。',
      tags: ['material', 'PBR', 'texture'],
      terms: ['pbr', 'roughness', 'metalness', 'texture', 'mipmap', 'color-space', 'environment-map']
    },
    narrative: {
      overview: '材质不是“换个颜色”这么简单，真实感来自光照模型、贴图和环境反射的组合。',
      mentalModel: 'roughness 控制反射糊不糊，metalness 控制像不像金属，envMap 决定反射里有什么。',
      keyPoints: [
        'MeshStandardMaterial 是最常用的 PBR 材质。',
        '颜色贴图通常用 sRGB，数据贴图通常保持 Linear。',
        '金属材质非常依赖环境贴图。'
      ],
      commonMistakes: [
        '金属度拉满但没有环境贴图，结果灰扑扑。',
        '把 roughness 和 metalness 当亮度调节。',
        '没有设置 texture colorSpace 导致颜色发灰。'
      ]
    },
    controls: [
      select('materialType', '材质类型', 'physical', '比较基础材质、PBR 材质和法线材质。', [['physical', 'Physical'], ['standard', 'Standard'], ['basic', 'Basic'], ['normal', 'Normal']]),
      color('materialColor', '基础色', '#fb923c', '改变 material.color。'),
      range('roughness', '粗糙度', 0.35, 0, 1, 0.01, '越低越像镜面，越高越哑光。'),
      range('metalness', '金属度', 0.6, 0, 1, 0.01, '金属材质主要反射环境。'),
      range('envIntensity', '环境强度', 1, 0, 3, 0.05, '控制环境贴图对 PBR 的影响。'),
      toggle('textureEnabled', '程序贴图', true, '打开 checker texture，观察 UV 映射。')
    ],
    exercises: [
      {
        id: 'material-pbr-edit',
        title: '调出金属质感',
        goal: '把 metalness 调到 0.8 以上，roughness 调到 0.25 以下。',
        hint: '金属感来自高 metalness 和较低 roughness。',
        checks: [
          { source: 'control', key: 'metalness', op: 'gte', value: 0.8 },
          { source: 'control', key: 'roughness', op: 'lte', value: 0.25 }
        ]
      },
      {
        id: 'material-enable-texture',
        title: '开启纹理观察 UV',
        goal: '打开程序贴图，观察球体表面贴图分布。',
        hint: 'checker 图案能快速暴露 UV 拉伸。',
        checks: [{ source: 'control', key: 'textureEnabled', op: 'truthy' }]
      }
    ],
    source: `const texture = new THREE.CanvasTexture(canvas);
texture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshPhysicalMaterial({
  color,
  roughness,
  metalness,
  envMapIntensity,
  map: texture
});`
  },
  {
    kind: 'lighting',
    accent: 0xfacc15,
    meta: {
      id: 'lighting-shadow-tone',
      title: '05. 灯光、阴影与空间层次',
      stage: '效果',
      difficulty: '进阶',
      estimatedMinutes: 28,
      summary: '用环境光、方向光、点光和 shadow map 理解立体感从哪来。',
      tags: ['light', 'shadow', 'tone mapping'],
      terms: ['light', 'shadow-map', 'tone-mapping', 'color-space']
    },
    narrative: {
      overview: '灯光决定空间层次。材质再好，光打坏了也会像塑料。',
      mentalModel: 'AmbientLight 给基础亮度，DirectionalLight 像太阳，PointLight 像灯泡，shadow map 负责接地感。',
      keyPoints: [
        '阴影要同时开启 renderer.shadowMap、light.castShadow、mesh.castShadow / receiveShadow。',
        '方向光的位置影响阴影方向。',
        '阴影范围越大，固定分辨率下越容易糊。'
      ],
      commonMistakes: [
        '只开 renderer.shadowMap，忘了 mesh.castShadow。',
        'AmbientLight 太高导致画面没有层次。',
        '阴影锯齿时只调 mapSize，不调 light camera 范围。'
      ]
    },
    controls: [
      range('ambientIntensity', '环境光', 0.25, 0, 2, 0.01, '基础亮度，太高会压平层次。'),
      range('keyIntensity', '主光强度', 2.5, 0, 6, 0.05, '方向光强度，影响主体明暗和阴影。'),
      range('lightHeight', '主光高度', 5, 1, 9, 0.1, '改变阴影方向和长度。'),
      color('lightColor', '主光颜色', '#ffffff', '暖光、冷光会显著改变情绪。'),
      toggle('shadowEnabled', '阴影', true, '打开或关闭 shadow map。')
    ],
    exercises: [
      {
        id: 'lighting-low-ambient',
        title: '做出层次',
        goal: '把环境光调到 0.5 以下，同时保持阴影开启。',
        hint: '环境光太高，阴影和体积感会被洗掉。',
        checks: [
          { source: 'control', key: 'ambientIntensity', op: 'lte', value: 0.5 },
          { source: 'control', key: 'shadowEnabled', op: 'truthy' }
        ]
      },
      {
        id: 'lighting-tune-shadow',
        title: '调亮主光',
        goal: '把主光强度调到 3 以上，观察阴影边界和高光。',
        hint: '主光越强，明暗对比越明显。',
        checks: [{ source: 'control', key: 'keyIntensity', op: 'gte', value: 3 }]
      }
    ],
    source: `renderer.shadowMap.enabled = true;
directionalLight.castShadow = true;
mesh.castShadow = true;
floor.receiveShadow = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.25);
const key = new THREE.DirectionalLight(0xffffff, 2.5);`
  },
  {
    kind: 'camera',
    accent: 0x06b6d4,
    meta: {
      id: 'camera-projection-controls',
      title: '06. 相机、投影与观察控制',
      stage: '核心',
      difficulty: '进阶',
      estimatedMinutes: 24,
      summary: '比较 PerspectiveCamera 和 OrthographicCamera，理解 FOV、距离、OrbitControls。',
      tags: ['camera', 'projection', 'controls'],
      terms: ['camera', 'orbit-controls', 'device-pixel-ratio']
    },
    narrative: {
      overview: '相机决定你看到什么，不是模型变了，而是观察方式变了。',
      mentalModel: 'Perspective 像人眼，近大远小；Orthographic 像工程图，没有透视缩放。',
      keyPoints: [
        'FOV 越大，透视变形越强。',
        'near/far 设置不合理会导致深度精度问题。',
        'OrbitControls 的 target 是观察中心。'
      ],
      commonMistakes: [
        '窗口变化后不更新 camera.aspect。',
        '模型看不到就盲目改模型位置，没检查 camera near/far。',
        '把 OrbitControls 当业务交互，忘了实际产品需要更细的控制。'
      ]
    },
    controls: [
      select('projection', '投影方式', 'perspective', '切换透视和正交观察。', [['perspective', 'Perspective'], ['orthographic', 'Orthographic']]),
      range('fov', 'FOV', 52, 25, 90, 1, '透视相机视野角。', 'deg'),
      range('cameraDistance', '相机距离', 7, 3, 13, 0.1, '相机离目标点越远，物体越小。'),
      toggle('autoOrbit', '自动环绕', false, '自动移动相机观察目标。'),
      toggle('showAxes', '显示坐标轴', true, '辅助判断相机观察方向。')
    ],
    exercises: [
      {
        id: 'camera-use-orthographic',
        title: '切到正交',
        goal: '把投影方式切换为 Orthographic，比较透视差异。',
        hint: '正交相机不会近大远小。',
        checks: [{ source: 'control', key: 'projection', op: 'eq', value: 'orthographic' }]
      },
      {
        id: 'camera-wide-fov',
        title: '夸张透视',
        goal: '切回 Perspective，并把 FOV 调到 75 以上。',
        hint: '大 FOV 会带来更强透视张力。',
        checks: [
          { source: 'control', key: 'projection', op: 'eq', value: 'perspective' },
          { source: 'control', key: 'fov', op: 'gte', value: 75 }
        ]
      }
    ],
    source: `const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 250);
camera.position.set(0, 1.8, distance);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;`
  },
  {
    kind: 'interaction',
    accent: 0xec4899,
    meta: {
      id: 'interaction-raycaster-transform',
      title: '07. Raycaster 与 TransformControls',
      stage: '交互',
      difficulty: '进阶',
      estimatedMinutes: 34,
      summary: '学习鼠标拾取、悬停高亮、点击选中和 gizmo 变换。',
      tags: ['raycaster', 'pointer', 'editor'],
      terms: ['raycaster', 'transform-controls', 'orbit-controls', 'object3d']
    },
    narrative: {
      overview: '真正的交互不是给 canvas 绑 click，而是把屏幕坐标转成 3D 射线。',
      mentalModel: '鼠标点是屏幕 2D，Raycaster 把它变成从相机发出的 3D 射线，命中哪个对象就能选哪个。',
      keyPoints: [
        'pointer 坐标要归一化到 -1 到 1。',
        'TransformControls 拖拽时要临时禁用 OrbitControls。',
        '交互对象最好有明确的命名和选择状态。'
      ],
      commonMistakes: [
        '拿 clientX/clientY 直接做世界坐标。',
        '忘了 canvas bounding rect，页面滚动后拾取偏移。',
        '拖拽 gizmo 时 OrbitControls 还在抢事件。'
      ]
    },
    controls: [
      select('transformMode', '变换模式', 'translate', '切换 gizmo 的移动、旋转、缩放模式。', [['translate', 'Translate'], ['rotate', 'Rotate'], ['scale', 'Scale']]),
      color('highlightColor', '高亮颜色', '#22d3ee', '悬停和选中对象的 emissive 颜色。'),
      range('hoverSpin', '物体自转', 0.45, 0, 2, 0.05, '让可拾取对象持续旋转，便于观察。'),
      toggle('snap', '吸附', false, '开启 0.25 单位平移吸附和 15 度旋转吸附。')
    ],
    exercises: [
      {
        id: 'interaction-select-object',
        title: '点击选中一个物体',
        goal: '在画布中点击任意彩色物体，观察高亮和 gizmo。',
        hint: '点击画布中的小方块或小球。',
        checks: [{ source: 'flag', key: 'selectedObject', op: 'truthy' }]
      },
      {
        id: 'interaction-rotate-snap',
        title: '切换旋转吸附',
        goal: '把变换模式切到 Rotate，并打开吸附。',
        hint: '编辑器类工具常用 snap 提升精确度。',
        checks: [
          { source: 'control', key: 'transformMode', op: 'eq', value: 'rotate' },
          { source: 'control', key: 'snap', op: 'truthy' }
        ]
      }
    ],
    source: `pointer.x = (event.clientX / canvasWidth) * 2 - 1;
pointer.y = -(event.clientY / canvasHeight) * 2 + 1;

raycaster.setFromCamera(pointer, camera);
const [hit] = raycaster.intersectObjects(pickableObjects);
if (hit) transformControls.attach(hit.object);`
  },
  {
    kind: 'assets',
    accent: 0x14b8a6,
    meta: {
      id: 'assets-gltf-pipeline',
      title: '08. glTF / GLB 资产管线',
      stage: '资产',
      difficulty: '进阶',
      estimatedMinutes: 36,
      summary: '理解模型加载、包围盒检查、压缩格式、贴图排错和动画资产意识。',
      tags: ['gltf', 'glb', 'loader', 'asset'],
      terms: ['gltf', 'glb', 'draco', 'ktx2', 'texture', 'dispose']
    },
    narrative: {
      overview: '项目里的模型不是“丢进来就完事”，要检查大小、中心点、包围盒、材质、贴图和压缩策略。',
      mentalModel: 'glTF 是交付格式，Loader 是入口，加载后要做定位、缩放、遍历材质、阴影和资源释放。',
      keyPoints: [
        'GLB 适合线上交付，glTF 适合调试和拆分资源。',
        'DRACO 压几何，KTX2 压纹理，别把两个东西混了。',
        '模型中心点和尺寸不对，交互、相机和阴影都会跟着乱。'
      ],
      commonMistakes: [
        '加载后模型巨大或消失，不检查 bounding box。',
        '压缩只看下载体积，不看解码时间。',
        '切换模型时忘记 dispose 旧材质和贴图。'
      ]
    },
    controls: [
      button('loadModel', '重新加载模型', '模拟重新进入资产加载流程。'),
      select('textureVariant', '材质变体', 'clean', '模拟干净、磨损、金属三种资产材质状态。', [['clean', 'Clean'], ['worn', 'Worn'], ['metal', 'Metal']]),
      toggle('showBounds', '显示包围盒', false, '检查模型尺寸和中心点。'),
      toggle('compressionNotes', '压缩检查', false, '记录 DRACO / KTX2 的使用判断。'),
      range('assetRotation', '模型旋转', 0.45, 0, 2, 0.05, '让模型旋转，检查材质和法线问题。')
    ],
    exercises: [
      {
        id: 'assets-show-bounds',
        title: '打开包围盒',
        goal: '显示模型包围盒，理解加载后第一件事是检查尺寸。',
        hint: '打开“显示包围盒”。',
        checks: [{ source: 'control', key: 'showBounds', op: 'truthy' }]
      },
      {
        id: 'assets-compression-check',
        title: '做一次压缩判断',
        goal: '开启压缩检查，记住 DRACO 负责几何，KTX2 负责纹理。',
        hint: '两者不是互相替代。',
        checks: [{ source: 'control', key: 'compressionNotes', op: 'truthy' }]
      }
    ],
    source: `const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.setKTX2Loader(ktx2Loader.detectSupport(renderer));

const gltf = await loader.loadAsync('/model.glb');
const model = gltf.scene;
const box = new THREE.Box3().setFromObject(model);
scene.add(model);`
  },
  {
    kind: 'animation',
    accent: 0x8b5cf6,
    meta: {
      id: 'animation-mixer-actions',
      title: '09. 动画混合与时间控制',
      stage: '动画',
      difficulty: '进阶',
      estimatedMinutes: 32,
      summary: '通过角色小 rig 理解 AnimationMixer、action、timeScale 和 blend 权重。',
      tags: ['animation', 'mixer', 'action'],
      terms: ['animation-mixer', 'clip-action', 'delta-time', 'quaternion']
    },
    narrative: {
      overview: '动画系统重点不是“会动”，而是能控制播放速度、状态切换和动作混合。',
      mentalModel: 'AnimationClip 是素材，AnimationAction 是正在播放的实例，AnimationMixer 是调度员。',
      keyPoints: [
        'mixer.update(delta) 让动画时间和帧率解耦。',
        'action 可以调 weight、timeScale、loop 和 fade。',
        '角色动画切换要淡入淡出，否则会抽搐。'
      ],
      commonMistakes: [
        '每帧用固定值更新动画，帧率不同速度不同。',
        '直接切 action，角色姿势瞬间跳变。',
        '忘记停止或释放不再用的 action。'
      ]
    },
    controls: [
      select('action', '动作', 'idle', '切换 idle / walk / jump。', [['idle', 'Idle'], ['walk', 'Walk'], ['jump', 'Jump']]),
      range('timeScale', '时间缩放', 1, 0.1, 3, 0.05, '模拟 AnimationMixer 或 AnimationAction 的 timeScale。'),
      range('blendWeight', '混合权重', 1, 0, 1, 0.01, '模拟动作权重对姿态的影响。'),
      toggle('showAxes', '显示坐标轴', true, '观察角色局部和世界方向。')
    ],
    exercises: [
      {
        id: 'animation-walk-fast',
        title: '快走状态',
        goal: '选择 Walk，并把时间缩放调到 1.5 以上。',
        hint: 'timeScale 不是跳帧，是改变动画时间推进速度。',
        checks: [
          { source: 'control', key: 'action', op: 'eq', value: 'walk' },
          { source: 'control', key: 'timeScale', op: 'gte', value: 1.5 }
        ]
      },
      {
        id: 'animation-blend',
        title: '降低动作权重',
        goal: '把混合权重调到 0.5 以下，观察动作幅度变小。',
        hint: '真实 AnimationAction 会用 weight 参与混合。',
        checks: [{ source: 'control', key: 'blendWeight', op: 'lte', value: 0.5 }]
      }
    ],
    source: `const mixer = new THREE.AnimationMixer(model);
const walk = mixer.clipAction(walkClip);
walk.play();

function animate(delta) {
  walk.timeScale = timeScale;
  walk.weight = blendWeight;
  mixer.update(delta);
}`
  },
  {
    kind: 'postprocessing',
    accent: 0xe879f9,
    meta: {
      id: 'postprocessing-composer-bloom',
      title: '10. 后处理、Bloom 与曝光',
      stage: '效果',
      difficulty: '进阶',
      estimatedMinutes: 30,
      summary: '用 EffectComposer 串联 RenderPass、UnrealBloomPass 和 OutputPass。',
      tags: ['postprocessing', 'bloom', 'composer'],
      terms: ['post-processing', 'effect-composer', 'bloom', 'tone-mapping', 'render-pipeline']
    },
    narrative: {
      overview: '后处理是“成片阶段”。模型不变，但最终画面可以完全不同。',
      mentalModel: '先把场景渲染到纹理，再让一个个 pass 对这张图做加工。',
      keyPoints: [
        'EffectComposer 管理 pass 链。',
        'Bloom 通常依赖高亮区域和曝光。',
        '后处理会增加 GPU 成本，要按效果价值决定。'
      ],
      commonMistakes: [
        'Bloom 强度过大导致画面糊成一片。',
        '开了 composer 还继续 renderer.render，结果管线不一致。',
        '忘记 OutputPass 或颜色空间处理导致颜色异常。'
      ]
    },
    controls: [
      toggle('bloomEnabled', '启用 Bloom', true, '打开后处理合成器和泛光 pass。'),
      range('bloomStrength', 'Bloom 强度', 0.8, 0, 3, 0.05, '控制高亮扩散强度。'),
      range('exposure', '曝光', 1, 0.2, 2.4, 0.05, 'renderer toneMappingExposure。'),
      range('postSpin', '场景旋转', 0.35, 0, 1.5, 0.05, '让发光物体运动起来便于观察后处理。')
    ],
    exercises: [
      {
        id: 'post-enable-bloom',
        title: '打开 Bloom',
        goal: '启用 Bloom，并把 Bloom 强度调到 1.2 以上。',
        hint: '别太高，高了就是糊。',
        checks: [
          { source: 'control', key: 'bloomEnabled', op: 'truthy' },
          { source: 'control', key: 'bloomStrength', op: 'gte', value: 1.2 }
        ]
      },
      {
        id: 'post-exposure',
        title: '调一次曝光',
        goal: '把曝光调到 1.3 以上，观察高亮变化。',
        hint: '曝光影响 tone mapping 前后的亮度感受。',
        checks: [{ source: 'control', key: 'exposure', op: 'gte', value: 1.3 }]
      }
    ],
    source: `const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(size, strength, radius, threshold));
composer.addPass(new OutputPass());

function animate() {
  composer.render();
}`
  },
  {
    kind: 'optimization',
    accent: 0x84cc16,
    meta: {
      id: 'optimization-renderer-info',
      title: '11. 性能优化与 renderer.info',
      stage: '优化',
      difficulty: '进阶',
      estimatedMinutes: 38,
      summary: '比较普通 mesh 和 InstancedMesh，观察 draw call、triangles、objects 指标。',
      tags: ['performance', 'instancing', 'draw call'],
      terms: ['draw-call', 'instancing', 'lod', 'frustum-culling', 'renderer-info', 'dispose']
    },
    narrative: {
      overview: '优化不是凭感觉，先看指标，再判断是 CPU、GPU、内存还是资源生命周期问题。',
      mentalModel: '同样 500 个小方块，用 500 个 mesh 可能有 500 次 draw call，用 InstancedMesh 可以大幅合并。',
      keyPoints: [
        'draw call 多会增加 CPU 提交压力。',
        'InstancedMesh 适合大量重复几何和材质。',
        '切课或切模型必须 dispose，优化不是只看 FPS。'
      ],
      commonMistakes: [
        '只盯 FPS，不看 calls、triangles、textures。',
        '把所有优化都归结为“模型太大”。',
        '用了实例化但每个实例材质都不同，合批意义就没了。'
      ]
    },
    controls: [
      range('objectCount', '对象数量', 160, 20, 700, 10, '增加对象数量观察指标变化。'),
      toggle('useInstancing', '使用 InstancedMesh', true, '用实例化合并大量重复绘制。'),
      toggle('rotateCrowd', '旋转阵列', true, '保持运动，观察渲染稳定性。')
    ],
    exercises: [
      {
        id: 'optimization-instancing',
        title: '启用实例化',
        goal: '保持对象数量 300 以上，并启用 InstancedMesh。',
        hint: '观察性能面板里的 calls 变化。',
        checks: [
          { source: 'control', key: 'objectCount', op: 'gte', value: 300 },
          { source: 'control', key: 'useInstancing', op: 'truthy' }
        ]
      },
      {
        id: 'optimization-compare',
        title: '做一次对比',
        goal: '关闭 InstancedMesh，再打开它，对比 draw calls。',
        hint: '这个练习靠你观察右侧 metrics，不是靠自动判定全部过程。',
        checks: [{ source: 'flag', key: 'usedInstancing', op: 'truthy' }]
      }
    ],
    source: `const mesh = new THREE.InstancedMesh(geometry, material, count);
const dummy = new THREE.Object3D();

for (let i = 0; i < count; i++) {
  dummy.position.set(x, y, z);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}

console.log(renderer.info.render.calls);`
  },
  {
    kind: 'shader',
    accent: 0x38bdf8,
    meta: {
      id: 'shader-glsl-uniforms',
      title: '12. GLSL ShaderMaterial',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 42,
      summary: '用 vertex shader 做波浪，用 fragment shader 做渐变，理解 uniform / varying。',
      tags: ['shader', 'glsl', 'uniform'],
      terms: ['shader', 'uniform', 'varying', 'vertex-shader', 'fragment-shader', 'render-pipeline']
    },
    narrative: {
      overview: 'shader 是 GPU 上跑的小程序。你终于可以不被内置材质限制，自己决定顶点和像素怎么变化。',
      mentalModel: 'vertex shader 管点的位置，fragment shader 管像素颜色，uniform 是 JS 传进去的旋钮。',
      keyPoints: [
        'uniform 适合传时间、颜色、强度等全局参数。',
        'varying 把顶点阶段的数据插值传到片元阶段。',
        'shader 报错通常是 GLSL 类型或变量名问题。'
      ],
      commonMistakes: [
        '忘记 projectionMatrix * modelViewMatrix，结果模型不在正确空间。',
        'JS 里改了 uniform 对象引用方式不对。',
        '把 CPU 循环能做的事全塞 shader，忽略调试成本。'
      ]
    },
    controls: [
      range('frequency', '波浪频率', 3, 0.5, 10, 0.1, '控制 sin 波密度。'),
      range('amplitude', '波浪幅度', 0.35, 0, 1.2, 0.01, '控制顶点位移强度。'),
      color('colorA', '颜色 A', '#38bdf8', 'fragment shader 渐变起点。'),
      color('colorB', '颜色 B', '#ffd166', 'fragment shader 渐变终点。'),
      toggle('animateShader', '时间动画', true, '用 uTime 驱动动态波浪。')
    ],
    exercises: [
      {
        id: 'shader-amplitude',
        title: '做出明显波浪',
        goal: '把波浪幅度调到 0.7 以上。',
        hint: '这是 vertex shader 位移，不是 mesh.scale。',
        checks: [{ source: 'control', key: 'amplitude', op: 'gte', value: 0.7 }]
      },
      {
        id: 'shader-color',
        title: '换一组颜色',
        goal: '修改颜色 A 或颜色 B。',
        hint: 'uniform 颜色会传入 fragment shader。',
        checks: [{ source: 'flag', key: 'editedUniforms', op: 'truthy' }]
      }
    ],
    source: `const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.35 }
  },
  vertexShader,
  fragmentShader
});

material.uniforms.uTime.value = elapsed;`
  },
  {
    kind: 'physics',
    accent: 0xef4444,
    meta: {
      id: 'physics-rapier-rigidbody',
      title: '13. Rapier 物理、刚体与碰撞',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 40,
      summary: '用小球下落理解 gravity、restitution、RigidBody、Collider 和物理 fallback。',
      tags: ['physics', 'rapier', 'rigid body'],
      terms: ['rapier', 'rigid-body', 'collider', 'delta-time']
    },
    narrative: {
      overview: '真实碰撞别手搓。教学里可以简化，项目里要用成熟物理引擎。',
      mentalModel: 'Mesh 是看得见的外壳，RigidBody / Collider 是物理世界里的身体和碰撞形状。',
      keyPoints: [
        '渲染对象和物理刚体要每帧同步。',
        'Collider 应该尽量简单，别拿高模直接碰撞。',
        '物理步进也要考虑 delta time 和稳定性。'
      ],
      commonMistakes: [
        '把 mesh 位置改了但没同步 rigid body。',
        '碰撞体过复杂导致性能暴跌。',
        '物理世界单位和模型单位完全不统一。'
      ]
    },
    controls: [
      range('gravity', '重力', -9.8, -20, -1, 0.1, '模拟世界重力。'),
      range('restitution', '弹性', 0.72, 0, 1, 0.01, '碰撞后速度保留比例。'),
      button('spawnBall', '生成刚体球', '新增一个动态小球。'),
      button('resetPhysics', '重置物理', '把已有小球放回空中。')
    ],
    exercises: [
      {
        id: 'physics-spawn',
        title: '生成更多刚体',
        goal: '点击生成刚体球，让 spawned bodies 超过初始数量。',
        hint: '每个小球都对应一个可见 mesh 和一份物理状态。',
        checks: [{ source: 'flag', key: 'spawnedBodies', op: 'gte', value: 7 }]
      },
      {
        id: 'physics-bounce',
        title: '调高弹性',
        goal: '把弹性调到 0.9 以上。',
        hint: 'restitution 越高，碰撞后反弹越明显。',
        checks: [{ source: 'control', key: 'restitution', op: 'gte', value: 0.9 }]
      }
    ],
    source: `const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const rigidBody = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
const collider = world.createCollider(RAPIER.ColliderDesc.ball(0.5), rigidBody);

world.step();
mesh.position.copy(rigidBody.translation());`
  },
  {
    kind: 'webxr',
    accent: 0x60a5fa,
    meta: {
      id: 'webxr-capability-fallback',
      title: '14. WebXR 能力检测与控制器',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 34,
      summary: '理解 WebXR 支持检测、沉浸式会话、控制器射线和安全 fallback。',
      tags: ['webxr', 'vr', 'controller'],
      terms: ['webxr', 'orbit-controls', 'render-pipeline']
    },
    narrative: {
      overview: 'WebXR 不是所有浏览器都有，教学和产品都要优先做能力检测和回退。',
      mentalModel: '普通模式是一台 camera，XR 模式由设备会话提供姿态、视图和控制器输入。',
      keyPoints: [
        '先检查 navigator.xr，再判断 session mode。',
        'XR 控制器通常用射线进行 UI 和对象选择。',
        '沉浸式渲染循环由 XR session 驱动。'
      ],
      commonMistakes: [
        '桌面浏览器不支持就直接白屏。',
        '把鼠标交互照搬到手柄交互。',
        '忘记 XR 场景需要更稳定的帧率。'
      ]
    },
    controls: [
      toggle('simulateControllers', '模拟控制器射线', true, '展示左右手控制器射线概念。'),
      toggle('headsetView', '头显强调', false, '放大头显模型，观察设备概念。')
    ],
    exercises: [
      {
        id: 'webxr-simulate-controller',
        title: '显示控制器射线',
        goal: '打开模拟控制器射线。',
        hint: 'XR 交互常用 controller ray 做选择。',
        checks: [{ source: 'control', key: 'simulateControllers', op: 'truthy' }]
      },
      {
        id: 'webxr-fallback',
        title: '确认 fallback',
        goal: '观察状态栏里的 WebXR 支持情况，并保持 fallback 可见。',
        hint: '没有 XR 设备也能学习概念。',
        checks: [{ source: 'flag', key: 'webxrFallbackVisible', op: 'truthy' }]
      }
    ],
    source: `if ('xr' in navigator) {
  renderer.xr.enabled = true;
  const supported = await navigator.xr.isSessionSupported('immersive-vr');
}

const controller = renderer.xr.getController(0);
scene.add(controller);`
  },
  {
    kind: 'webgpu',
    accent: 0x2dd4bf,
    meta: {
      id: 'webgpu-pipeline-detection',
      title: '15. WebGPU 与现代渲染管线',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 44,
      summary: '通过 WebGL fallback 可视化 WebGPU pipeline、GPU capability 和高密度粒子概念。',
      tags: ['webgpu', 'pipeline', 'gpu'],
      terms: ['webgpu', 'render-pipeline', 'shader', 'renderer-info']
    },
    narrative: {
      overview: 'WebGPU 是未来方向，但现在学习要先理解能力检测、管线和 fallback。',
      mentalModel: 'WebGPU 更像现代图形 API：设备、管线、buffer、shader、pass 都更显式。',
      keyPoints: [
        'navigator.gpu 是最基础的能力入口。',
        'WebGPU 不只是渲染，也更适合 GPU 计算。',
        'WebGL fallback 仍然是现阶段产品兼容策略。'
      ],
      commonMistakes: [
        '把 WebGPU 当成“自动更快的 WebGL”。',
        '没有 fallback 就上线。',
        '不理解 pipeline，直接复制 shader 代码。'
      ]
    },
    controls: [
      select('pipelineMode', '管线模式', 'render', '比较 render pipeline 和 compute-like 概念。', [['render', 'Render Pipeline'], ['compute', 'Compute-like']]),
      range('particleCount', '粒子数量', 220, 50, 900, 10, '用实例化粒子模拟 GPU 批量处理。'),
      toggle('computeLike', '计算式运动', false, '提高旋转速度，模拟计算管线驱动状态。')
    ],
    exercises: [
      {
        id: 'webgpu-particles',
        title: '提高粒子密度',
        goal: '把粒子数量调到 500 以上。',
        hint: '观察 objects 和 draw calls，不要只盯视觉。',
        checks: [{ source: 'control', key: 'particleCount', op: 'gte', value: 500 }]
      },
      {
        id: 'webgpu-pipeline',
        title: '切换管线概念',
        goal: '把管线模式切到 Compute-like，并打开计算式运动。',
        hint: '这里用 WebGL 画面表达 WebGPU 概念，不伪装浏览器支持。',
        checks: [
          { source: 'control', key: 'pipelineMode', op: 'eq', value: 'compute' },
          { source: 'control', key: 'computeLike', op: 'truthy' }
        ]
      }
    ],
    source: `if ('gpu' in navigator) {
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
}

// WebGPU 的思维重点是显式 pipeline、buffer、shader 和 pass。`
  },
  {
    kind: 'lifecycle',
    accent: 0x8bd46f,
    meta: {
      id: 'lifecycle-dispose-memory',
      title: '16. 生命周期、dispose 与内存',
      stage: '优化',
      difficulty: '进阶',
      estimatedMinutes: 36,
      summary: '从“能跑”进阶到“能长期稳定运行”：理解对象重建、材质复用、dispose 和 renderer.info。',
      tags: ['dispose', 'memory', 'lifecycle'],
      terms: ['dispose', 'renderer-info', 'texture', 'draw-call']
    },
    narrative: {
      overview: 'Three.js 项目最容易被忽视的是资源生命周期。切场景、换模型、反复创建材质，如果不释放，最后不是卡，就是白屏。',
      mentalModel: 'JS 对象被垃圾回收，不代表 GPU 里的 geometry、material、texture 自动释放；你得明确调用 dispose。',
      keyPoints: [
        '重建对象前先释放旧 geometry 和 material。',
        '重复物体优先共享材质，减少内存和状态切换。',
        'renderer.info.memory 是排查泄漏的第一块仪表盘。'
      ],
      commonMistakes: [
        '只 remove(mesh)，不 dispose(mesh.geometry / mesh.material)。',
        '每个对象都 new 一个相同材质，结果显存和 draw state 都浪费。',
        '切换页面时忘记 dispose controls、composer、render target。'
      ]
    },
    controls: [
      range('activeObjects', '对象池数量', 18, 4, 80, 1, '模拟场景中不断创建和销毁的对象。'),
      toggle('reuseMaterial', '复用材质', true, '多个对象共享一个 material，观察资源策略差异。'),
      range('roughnessBudget', '材质粗糙度', 0.55, 0, 1, 0.01, '模拟统一材质参数预算。'),
      range('poolSpin', '对象池旋转', 0.35, 0, 1.5, 0.05, '保持运动便于观察。'),
      toggle('auditDispose', '执行释放审计', false, '确认切换或重建时要审计 dispose。')
    ],
    exercises: [
      {
        id: 'lifecycle-reuse-material',
        title: '复用材质策略',
        goal: '开启复用材质，并把对象池数量调到 40 以上。',
        hint: '大量重复对象不要无脑 new material。',
        checks: [
          { source: 'control', key: 'reuseMaterial', op: 'truthy' },
          { source: 'control', key: 'activeObjects', op: 'gte', value: 40 }
        ]
      },
      {
        id: 'lifecycle-audit',
        title: '做一次释放审计',
        goal: '打开释放审计，观察状态栏中的 renderer.info。',
        hint: '项目上线前，切场景必须看资源是否下降。',
        checks: [{ source: 'control', key: 'auditDispose', op: 'truthy' }]
      }
    ],
    source: `scene.remove(mesh);
mesh.geometry.dispose();
mesh.material.dispose();
controls.dispose();
composer.dispose();
renderTarget.dispose();

console.table(renderer.info.memory);`
  },
  {
    kind: 'procedural',
    accent: 0x38bdf8,
    meta: {
      id: 'procedural-city-generation',
      title: '17. 程序化建模与参数化场景',
      stage: '核心',
      difficulty: '进阶',
      estimatedMinutes: 42,
      summary: '用参数生成城市块，学习如何把规则、随机和材质策略组合成可控场景。',
      tags: ['procedural', 'generation', 'city'],
      terms: ['buffergeometry', 'attribute', 'object3d', 'instancing']
    },
    narrative: {
      overview: '高级 3D 项目不可能所有东西都手摆。程序化建模能让你用规则生成大量内容，还能保留可调性。',
      mentalModel: '程序化场景不是随机乱撒，而是用密度、尺寸、材质、种子和约束生成可复现的结构。',
      keyPoints: [
        '参数化能让设计和工程协作更顺。',
        '随机要有边界，最好能复现。',
        '程序生成也要考虑材质复用和几何复杂度。'
      ],
      commonMistakes: [
        '随机值没有范围，结果场景失控。',
        '生成很多对象但没考虑 draw call。',
        '程序化结果不可复现，调试直接上头。'
      ]
    },
    controls: [
      range('cityDensity', '城市密度', 9, 3, 15, 1, '控制网格数量。'),
      range('heightScale', '高度倍率', 1.2, 0.2, 3, 0.05, '控制建筑高度。'),
      range('streetWidth', '街道宽度', 0.18, 0.04, 0.38, 0.01, '控制建筑之间的间隔。'),
      select('materialMode', '材质策略', 'mixed', '比较共享材质和混合材质。', [['mixed', 'Mixed'], ['shared', 'Shared']]),
      range('citySpin', '城市旋转', 0.12, 0, 0.8, 0.02, '旋转查看城市结构。')
    ],
    exercises: [
      {
        id: 'procedural-density',
        title: '生成高密度城市',
        goal: '把城市密度调到 12 以上。',
        hint: '注意观察 objects 和 triangles 的变化。',
        checks: [{ source: 'control', key: 'cityDensity', op: 'gte', value: 12 }]
      },
      {
        id: 'procedural-shared-material',
        title: '切换共享材质',
        goal: '把材质策略切换为 Shared。',
        hint: '重复建筑共享材质更接近真实项目优化策略。',
        checks: [{ source: 'control', key: 'materialMode', op: 'eq', value: 'shared' }]
      }
    ],
    source: `for (const cell of grid) {
  const height = rule(cell.x, cell.z) * heightScale;
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, width),
    sharedMaterial
  );
  scene.add(mesh);
}`
  },
  {
    kind: 'particles',
    accent: 0xf472b6,
    meta: {
      id: 'particles-points-buffer',
      title: '18. 粒子系统与 Points',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 44,
      summary: '用 Points 和 BufferAttribute 做高数量粒子，理解 CPU 更新、顶点颜色和透明混合。',
      tags: ['particles', 'points', 'buffer'],
      terms: ['buffergeometry', 'attribute', 'shader', 'draw-call']
    },
    narrative: {
      overview: '粒子不是很多小 mesh，而是把大量点数据塞进 BufferGeometry，由 GPU 一次性绘制。',
      mentalModel: '每个粒子是 position / color 等 attribute 中的一行数据，PointsMaterial 或 shader 决定它怎么显示。',
      keyPoints: [
        'Points 通常比大量 Mesh 更适合粒子。',
        '动态粒子要注意 attribute.needsUpdate 的成本。',
        '透明粒子要处理 opacity、depthWrite 和 blending。'
      ],
      commonMistakes: [
        '用几千个 SphereGeometry 当粒子。',
        '每帧重建 BufferGeometry，而不是更新 attribute。',
        '透明粒子 depthWrite 不处理，排序和遮挡一团糟。'
      ]
    },
    controls: [
      range('particleAmount', '粒子数量', 1200, 100, 6000, 100, '控制 Points 中的点数量。'),
      range('pointSize', '点大小', 0.045, 0.01, 0.16, 0.005, '控制 PointsMaterial.size。'),
      range('particleSpread', '散布范围', 3.2, 1, 6, 0.1, '控制粒子云尺寸。'),
      toggle('vertexColors', '顶点颜色', true, '每个点使用独立颜色 attribute。'),
      toggle('animateParticles', '波浪动画', true, '每帧更新 position attribute。'),
      range('waveHeight', '波浪高度', 0.35, 0, 1.2, 0.02, '控制动态粒子起伏。')
    ],
    exercises: [
      {
        id: 'particles-high-count',
        title: '提高粒子数量',
        goal: '把粒子数量调到 3000 以上，并观察 draw call。',
        hint: 'Points 通常仍然只需要很少 draw call。',
        checks: [{ source: 'control', key: 'particleAmount', op: 'gte', value: 3000 }]
      },
      {
        id: 'particles-vertex-color',
        title: '启用顶点颜色',
        goal: '保持顶点颜色开启，理解 color attribute。',
        hint: '颜色不是每个粒子一个材质，而是一个 attribute。',
        checks: [{ source: 'control', key: 'vertexColors', op: 'truthy' }]
      }
    ],
    source: `const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const points = new THREE.Points(geometry, material);
scene.add(points);`
  },
  {
    kind: 'rendertarget',
    accent: 0x60a5fa,
    meta: {
      id: 'rendertarget-offscreen-texture',
      title: '19. RenderTarget 与离屏渲染',
      stage: '效果',
      difficulty: '硬核',
      estimatedMinutes: 46,
      summary: '学习把一个场景先渲染成纹理，再把纹理用于主场景，实现屏幕、镜面和高级后处理基础。',
      tags: ['render target', 'offscreen', 'texture'],
      terms: ['texture', 'post-processing', 'effect-composer', 'render-pipeline']
    },
    narrative: {
      overview: 'RenderTarget 是高级渲染的基本功：镜子、小地图、屏幕内屏幕、后处理，本质都离不开离屏纹理。',
      mentalModel: '先把 miniScene 渲染到 WebGLRenderTarget，再把 target.texture 当普通贴图使用。',
      keyPoints: [
        '渲染到 target 后要 setRenderTarget(null) 回到屏幕。',
        'target 分辨率越高越清晰，也越耗显存。',
        'RenderTarget 本身也需要 dispose。'
      ],
      commonMistakes: [
        '忘记切回默认 framebuffer，导致主画面没了。',
        'RenderTarget 分辨率无脑拉满。',
        '切换场景时忘记 target.dispose()。'
      ]
    },
    controls: [
      range('targetResolution', '离屏分辨率', 512, 128, 1024, 128, '控制 RenderTarget 尺寸。'),
      range('targetSpin', '离屏物体速度', 0.7, 0, 2, 0.05, '控制 miniScene 中物体旋转速度。'),
      toggle('showTargetGrid', '显示屏幕线框', false, '观察承载 target.texture 的平面。')
    ],
    exercises: [
      {
        id: 'rendertarget-high-res',
        title: '提高离屏分辨率',
        goal: '把离屏分辨率调到 768 以上。',
        hint: '清晰度和显存成本会一起上去。',
        checks: [{ source: 'control', key: 'targetResolution', op: 'gte', value: 768 }]
      },
      {
        id: 'rendertarget-wire',
        title: '打开承载平面线框',
        goal: '打开显示屏幕线框，确认纹理是贴在一个 plane 上。',
        hint: 'RenderTarget 的结果最后还是一张 texture。',
        checks: [{ source: 'control', key: 'showTargetGrid', op: 'truthy' }]
      }
    ],
    source: `const target = new THREE.WebGLRenderTarget(512, 512);
renderer.setRenderTarget(target);
renderer.render(miniScene, miniCamera);
renderer.setRenderTarget(null);

screen.material.map = target.texture;`
  },
  {
    kind: 'shaderNoise',
    accent: 0x2dd4bf,
    meta: {
      id: 'shader-noise-procedural-material',
      title: '20. Shader 噪声与程序材质',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 52,
      summary: '从简单波浪进阶到噪声程序材质，理解 hash、noise、smoothstep 和 uniform 调参。',
      tags: ['shader', 'noise', 'procedural material'],
      terms: ['shader', 'uniform', 'fragment-shader', 'varying']
    },
    narrative: {
      overview: '程序材质让你不依赖图片，也能生成火焰、水纹、云、扫描、溶解等效果。',
      mentalModel: '噪声函数把 UV 坐标变成可控随机值，再用 smoothstep、mix 和颜色 uniform 组合出图案。',
      keyPoints: [
        'hash 是伪随机，noise 是平滑随机。',
        'smoothstep 常用来做柔和边界。',
        '程序材质要把“可调参数”暴露成 uniform。'
      ],
      commonMistakes: [
        '把噪声当纯随机，结果画面闪烁。',
        '所有参数写死，后期没法调效果。',
        'shader 里过度复杂，移动端性能扛不住。'
      ]
    },
    controls: [
      range('noiseScale', '噪声缩放', 3.5, 0.8, 12, 0.1, '控制噪声图案密度。'),
      range('noiseContrast', '噪声对比', 1.2, 0.2, 3, 0.05, '控制颜色分界强度。'),
      color('noiseColorA', '颜色 A', '#38bdf8', '程序材质主色。'),
      color('noiseColorB', '颜色 B', '#fbbf24', '程序材质辅色。'),
      toggle('animateNoise', '噪声动画', true, '让 UV 随时间偏移。')
    ],
    exercises: [
      {
        id: 'shader-noise-scale',
        title: '做出细密噪声',
        goal: '把噪声缩放调到 7 以上。',
        hint: 'scale 越高，图案越细。',
        checks: [{ source: 'control', key: 'noiseScale', op: 'gte', value: 7 }]
      },
      {
        id: 'shader-noise-contrast',
        title: '增强边界',
        goal: '把噪声对比调到 2 以上。',
        hint: '对比提高后，图案边界更明显。',
        checks: [{ source: 'control', key: 'noiseContrast', op: 'gte', value: 2 }]
      }
    ],
    source: `float n = noise(vUv * uScale + uTime);
n = smoothstep(0.18, 0.86, n * uContrast);
vec3 color = mix(uColorA, uColorB, n);
gl_FragColor = vec4(color, 1.0);`
  },
  {
    kind: 'cameraPath',
    accent: 0xfacc15,
    meta: {
      id: 'camera-path-cinematic',
      title: '21. 镜头路径与 Cinematic 叙事',
      stage: '交互',
      difficulty: '进阶',
      estimatedMinutes: 38,
      summary: '用 CatmullRomCurve3 驱动相机路径，学习镜头运动、lookAt 和展示型页面叙事。',
      tags: ['camera', 'path', 'cinematic'],
      terms: ['camera', 'vector3', 'quaternion', 'orbit-controls']
    },
    narrative: {
      overview: '项目展示不是只有 OrbitControls。很多产品页、展厅和作品集需要设计镜头路径。',
      mentalModel: '路径决定相机位置，lookAt 或前视点决定相机朝向，速度决定叙事节奏。',
      keyPoints: [
        '曲线采样可用 getPointAt(progress)。',
        '相机位置和朝向要分开设计。',
        '自动镜头和用户控制要有清晰切换。'
      ],
      commonMistakes: [
        '路径速度忽快忽慢，没用归一化 progress。',
        '只移动相机不处理 lookAt。',
        '自动镜头和 OrbitControls 同时抢相机。'
      ]
    },
    controls: [
      toggle('playCameraPath', '播放镜头路径', false, '沿曲线自动移动相机。'),
      toggle('showCameraPath', '显示路径线', true, '显示 CatmullRomCurve3 轨迹。'),
      range('pathSpeed', '路径速度', 0.08, 0.02, 0.35, 0.01, '控制镜头推进速度。'),
      select('pathMode', '朝向模式', 'orbit', '比较看中心和看前方。', [['orbit', 'Look Center'], ['lookAhead', 'Look Ahead']])
    ],
    exercises: [
      {
        id: 'camera-path-play',
        title: '播放自动镜头',
        goal: '开启播放镜头路径，并显示路径线。',
        hint: '观察相机如何沿曲线移动。',
        checks: [
          { source: 'control', key: 'playCameraPath', op: 'truthy' },
          { source: 'control', key: 'showCameraPath', op: 'truthy' }
        ]
      },
      {
        id: 'camera-path-lookahead',
        title: '切换前视模式',
        goal: '把朝向模式切到 Look Ahead。',
        hint: '相机看前方会更像飞行动画。',
        checks: [{ source: 'control', key: 'pathMode', op: 'eq', value: 'lookAhead' }]
      }
    ],
    source: `const curve = new THREE.CatmullRomCurve3(points, true);
const progress = (elapsed * speed) % 1;
camera.position.copy(curve.getPointAt(progress));
camera.lookAt(curve.getPointAt((progress + 0.02) % 1));`
  },
  {
    kind: 'world',
    accent: 0x84cc16,
    meta: {
      id: 'world-chunks-lod',
      title: '22. 大世界分块、LOD 与雾',
      stage: '优化',
      difficulty: '硬核',
      estimatedMinutes: 50,
      summary: '用地形分块模拟大场景，理解 chunk、LOD、雾、视锥剔除和性能预算。',
      tags: ['world', 'LOD', 'chunks'],
      terms: ['lod', 'frustum-culling', 'renderer-info', 'buffergeometry']
    },
    narrative: {
      overview: '大场景不是把所有东西一次性塞进 scene。要分块、降级、剔除、雾化，还要控制加载范围。',
      mentalModel: '玩家附近高细节，远处低细节或雾中隐藏；看不见和不重要的东西就少画。',
      keyPoints: [
        'chunk 是加载、卸载和管理的基本单位。',
        'LOD 根据距离降低几何复杂度。',
        '雾不只是美术，也能帮助隐藏远处低细节。'
      ],
      commonMistakes: [
        '无限地图一次性全加载。',
        '远处对象还保留高模。',
        '只靠显卡硬扛，不做内容预算。'
      ]
    },
    controls: [
      range('chunkRadius', '分块半径', 3, 1, 5, 1, '控制生成多少圈地形块。'),
      range('terrainDetail', '中心细节', 12, 2, 24, 1, '控制地形网格细分。'),
      toggle('useLod', '启用 LOD', true, '远处地块降低细分。'),
      range('worldSpin', '世界旋转', 0.06, 0, 0.3, 0.01, '旋转观察分块。')
    ],
    exercises: [
      {
        id: 'world-enable-lod',
        title: '开启 LOD',
        goal: '保持 LOD 开启，并把分块半径调到 4 以上。',
        hint: '看 metrics 中 triangles 如何变化。',
        checks: [
          { source: 'control', key: 'useLod', op: 'truthy' },
          { source: 'control', key: 'chunkRadius', op: 'gte', value: 4 }
        ]
      },
      {
        id: 'world-high-detail',
        title: '提高中心细节',
        goal: '把中心细节调到 18 以上。',
        hint: '中心细节提升会直接增加三角面。',
        checks: [{ source: 'control', key: 'terrainDetail', op: 'gte', value: 18 }]
      }
    ],
    source: `for (const chunk of visibleChunks) {
  const distance = chunk.distanceTo(camera);
  const segments = useLod ? highDetail - distance * 3 : highDetail;
  const terrain = buildTerrainChunk(segments);
  scene.add(terrain);
}`
  },
  {
    kind: 'hud',
    accent: 0xa78bfa,
    meta: {
      id: 'hud-labels-poi',
      title: '23. 3D 标签、POI 与 HUD',
      stage: '交互',
      difficulty: '进阶',
      estimatedMinutes: 34,
      summary: '学习 Sprite 标签、跟随 3D 物体、朝向相机和简单遮挡策略。',
      tags: ['hud', 'sprite', 'poi'],
      terms: ['sprite', 'camera', 'raycaster', 'object3d']
    },
    narrative: {
      overview: '业务 3D 项目常常需要标签、热点、说明和 HUD。它们看似 UI，其实要和 3D 坐标同步。',
      mentalModel: '标签锚定在 3D 物体上，每帧复制位置、面向相机，必要时做遮挡或透明处理。',
      keyPoints: [
        'Sprite 天然面向相机，适合轻量标签。',
        '复杂 UI 可用 HTML overlay，但要做 worldToScreen。',
        '标签遮挡可以用 raycaster 或深度策略处理。'
      ],
      commonMistakes: [
        '标签固定在屏幕位置，不跟物体走。',
        '标签太多导致信息拥挤。',
        '不处理遮挡，背后的点也亮着。'
      ]
    },
    controls: [
      toggle('showLabels', '显示标签', true, '显示所有 POI 标签。'),
      range('labelScale', '标签大小', 1, 0.5, 2, 0.05, '控制标签可读性。'),
      toggle('fakeOcclusion', '模拟遮挡', false, '用透明度模拟背面标签遮挡。')
    ],
    exercises: [
      {
        id: 'hud-labels-on',
        title: '打开 POI 标签',
        goal: '保持标签显示，并把标签大小调到 1.4 以上。',
        hint: 'UI 要能读，但也不能盖住场景。',
        checks: [
          { source: 'control', key: 'showLabels', op: 'truthy' },
          { source: 'control', key: 'labelScale', op: 'gte', value: 1.4 }
        ]
      },
      {
        id: 'hud-occlusion',
        title: '理解遮挡',
        goal: '打开模拟遮挡。',
        hint: '真实项目可以用 raycaster 判断标签是否被挡住。',
        checks: [{ source: 'control', key: 'fakeOcclusion', op: 'truthy' }]
      }
    ],
    source: `label.position.copy(mesh.position).add(new THREE.Vector3(0, 0.5, 0));
label.lookAt(camera.position);

// 复杂业务可用 raycaster 做遮挡检测
label.visible = !isOccluded;`
  },
  {
    kind: 'product',
    accent: 0xff816b,
    meta: {
      id: 'project-product-showcase',
      title: '24. 项目实战：产品展示',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 60,
      summary: '把材质、灯光、镜头、标签和调参组合成一个产品展示场景。',
      tags: ['project', 'product', 'showcase'],
      terms: ['pbr', 'roughness', 'metalness', 'tone-mapping', 'environment-map']
    },
    narrative: {
      overview: '产品展示是 Three.js 最常见商业场景之一，重点是质感、灯光、镜头和可调配置。',
      mentalModel: '一个完整产品页不是单个模型，而是一套可控视觉系统：材质、灯光、转台、标签、曝光和交互。',
      keyPoints: [
        '产品展示要先确定材质语言。',
        '转台动画要稳定且不抢用户控制。',
        '核心参数应暴露给运营或配置系统。'
      ],
      commonMistakes: [
        '只把模型放上去，缺少灯光和材质设计。',
        '材质参数写死，后续换主题很痛苦。',
        '转台速度太快，用户看不清细节。'
      ]
    },
    controls: [
      color('productColor', '产品颜色', '#38bdf8', '模拟商品主题色。'),
      range('productRoughness', '产品粗糙度', 0.24, 0, 1, 0.01, '控制表面反射清晰度。'),
      range('productMetalness', '产品金属度', 0.55, 0, 1, 0.01, '控制金属质感。'),
      toggle('showBrandLabel', '显示品牌标签', true, '显示产品标签。'),
      toggle('turntable', '转台动画', true, '持续展示产品。'),
      range('turntableSpeed', '转台速度', 0.5, 0, 1.5, 0.05, '控制展示节奏。')
    ],
    exercises: [
      {
        id: 'product-tune-material',
        title: '调出高端质感',
        goal: '把金属度调到 0.75 以上，粗糙度调到 0.3 以下。',
        hint: '高端金属质感通常依赖低 roughness 和环境反射。',
        checks: [
          { source: 'control', key: 'productMetalness', op: 'gte', value: 0.75 },
          { source: 'control', key: 'productRoughness', op: 'lte', value: 0.3 }
        ]
      },
      {
        id: 'product-turntable',
        title: '开启稳定转台',
        goal: '开启转台动画，并把速度控制在 0.8 以下。',
        hint: '展示不是炫技，能看清才是第一位。',
        checks: [
          { source: 'control', key: 'turntable', op: 'truthy' },
          { source: 'control', key: 'turntableSpeed', op: 'lte', value: 0.8 }
        ]
      }
    ],
    source: `const material = new THREE.MeshPhysicalMaterial({
  color,
  roughness,
  metalness,
  envMapIntensity: 1.2
});

product.rotation.y += delta * turntableSpeed;`
  },
  {
    kind: 'dataviz',
    accent: 0x22c55e,
    meta: {
      id: 'project-3d-data-visualization',
      title: '25. 项目实战：3D 数据可视化',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 58,
      summary: '把数据映射为高度、颜色、布局和阈值过滤，学习 3D 可视化的基本工程判断。',
      tags: ['project', 'dataviz', 'mapping'],
      terms: ['buffergeometry', 'color-space', 'raycaster', 'renderer-info']
    },
    narrative: {
      overview: '3D 可视化不是把柱状图立起来就完事，要考虑数据映射、可读性、交互和性能。',
      mentalModel: '数据值映射到高度、颜色、位置或动画；用户通过阈值、布局和交互理解模式。',
      keyPoints: [
        '数据映射要稳定，不能每次刷新乱跳。',
        '颜色表达要有语义，不要全靠炫。',
        '3D 可视化要比 2D 多付出交互和遮挡成本。'
      ],
      commonMistakes: [
        '为了 3D 而 3D，信息密度反而下降。',
        '颜色太花，看不出大小关系。',
        '柱子太多不做过滤和层级。'
      ]
    },
    controls: [
      range('barCount', '数据条数', 24, 8, 80, 1, '控制数据规模。'),
      range('threshold', '阈值过滤', 0.25, 0, 1.5, 0.05, '过滤低值数据。'),
      select('chartLayout', '图表布局', 'grid', '切换网格和环形布局。', [['grid', 'Grid'], ['radial', 'Radial']]),
      range('chartSpin', '图表旋转', 0.2, 0, 0.8, 0.02, '旋转观察数据结构。')
    ],
    exercises: [
      {
        id: 'dataviz-radial',
        title: '切到环形布局',
        goal: '把图表布局切换为 Radial。',
        hint: '同一份数据可以有不同空间布局。',
        checks: [{ source: 'control', key: 'chartLayout', op: 'eq', value: 'radial' }]
      },
      {
        id: 'dataviz-filter',
        title: '做一次阈值过滤',
        goal: '把阈值调到 0.8 以上，观察可见柱子减少。',
        hint: '过滤是可视化交互的基本能力。',
        checks: [{ source: 'control', key: 'threshold', op: 'gte', value: 0.8 }]
      }
    ],
    source: `const height = normalize(value) * maxHeight;
const color = gradient.lerp(value);
const bar = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), material);
bar.position.y = height / 2;`
  },
  {
    kind: 'portfolio',
    accent: 0xb79cff,
    meta: {
      id: 'capstone-portfolio-project',
      title: '26. 毕业项目：作品集级场景',
      stage: '高级',
      difficulty: '硬核',
      estimatedMinutes: 90,
      summary: '把前面所有能力组合成一个可展示、可解释、可优化的完整 Three.js 作品。',
      tags: ['capstone', 'portfolio', 'architecture'],
      terms: ['render-pipeline', 'dispose', 'renderer-info', 'post-processing', 'raycaster']
    },
    narrative: {
      overview: '毕业项目的目标不是再学一个 API，而是证明你能把模型、材质、灯光、交互、性能和叙事组合起来。',
      mentalModel: '作品集项目要有明确主题、稳定工程结构、可解释技术点、可测性能指标和可复用组件。',
      keyPoints: [
        '先写项目目标和视觉参考，再开始堆代码。',
        '每个效果都要能说明成本和价值。',
        '交付时要包含 README、性能截图和兼容 fallback。'
      ],
      commonMistakes: [
        '做成一堆效果拼盘，没有主题。',
        '只在自己电脑能跑，不做移动端和低端机检查。',
        '没有复盘和文档，别人看不懂你做了什么。'
      ]
    },
    controls: [
      select('capstoneMode', '作品形态', 'gallery', '选择最终项目的表达方向。', [['gallery', 'Gallery'], ['landing', 'Landing'], ['caseStudy', 'Case Study']]),
      toggle('projectChecklist', '交付检查清单', false, '确认 README、性能、兼容、资源来源都完成。'),
      range('portfolioSpin', '作品旋转', 0.22, 0, 0.8, 0.02, '控制展示节奏。')
    ],
    exercises: [
      {
        id: 'capstone-mode',
        title: '选定作品形态',
        goal: '把作品形态切换到 Landing 或 Case Study。',
        hint: '作品要服务目标，不是技术乱炫。',
        checks: [{ source: 'control', key: 'capstoneMode', op: 'neq', value: 'gallery' }]
      },
      {
        id: 'capstone-checklist',
        title: '完成交付清单',
        goal: '打开交付检查清单。',
        hint: '真正能交付的项目必须有文档、性能和兼容说明。',
        checks: [{ source: 'control', key: 'projectChecklist', op: 'truthy' }]
      }
    ],
    source: `// Capstone checklist
// 1. Scene architecture
// 2. Asset manifest and licenses
// 3. Interaction states
// 4. Performance budget
// 5. Mobile and fallback checks`
  }
];
