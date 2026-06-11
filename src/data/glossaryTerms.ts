import type { GlossaryTerm } from '../types';

export const glossaryTerms: GlossaryTerm[] = [
  {
    id: 'scene',
    term: 'Scene',
    cn: '场景',
    category: '入门',
    definition: 'Three.js 中所有可渲染对象、灯光、辅助线和分组的容器。',
    whyItMatters: '你可以把它理解为舞台；没有 scene，mesh 和 light 都没地方站。',
    related: ['Object3D', 'Camera', 'Renderer']
  },
  {
    id: 'camera',
    term: 'Camera',
    cn: '相机',
    category: '入门',
    definition: '决定用户从哪个位置、角度和投影方式观察 3D 世界。',
    whyItMatters: 'FOV、near、far 和 aspect 设置错了，模型没坏也会像失踪一样。',
    related: ['PerspectiveCamera', 'OrthographicCamera', 'Frustum']
  },
  {
    id: 'renderer',
    term: 'WebGLRenderer',
    cn: '渲染器',
    category: '入门',
    definition: '把 scene 和 camera 的结果绘制到 canvas 上的核心对象。',
    whyItMatters: '清晰度、色彩空间、阴影、tone mapping 和性能统计都绕不开 renderer。',
    related: ['Canvas', 'Color Space', 'renderer.info']
  },
  {
    id: 'mesh',
    term: 'Mesh',
    cn: '网格对象',
    category: '入门',
    definition: 'Geometry 和 Material 的组合，表示一个可见的 3D 物体。',
    whyItMatters: '几何决定形状，材质决定表面，看懂 Mesh 才能真正开始搭场景。',
    related: ['Geometry', 'Material', 'Object3D']
  },
  {
    id: 'animation-loop',
    term: 'Animation Loop',
    cn: '动画循环',
    category: '入门',
    definition: '每帧更新状态并调用 renderer.render 的循环。',
    whyItMatters: '旋转、交互、物理、后处理和性能统计都依赖稳定的帧循环。',
    related: ['requestAnimationFrame', 'Delta Time', 'Clock']
  },
  {
    id: 'object3d',
    term: 'Object3D',
    cn: '三维对象基类',
    category: '核心',
    definition: 'Three.js 大多数对象的基类，提供 position、rotation、scale、matrix 和层级关系。',
    whyItMatters: '理解 Object3D，就理解了场景图、父子变换和模型层级。',
    related: ['Scene Graph', 'Matrix4', 'Group']
  },
  {
    id: 'vector3',
    term: 'Vector3',
    cn: '三维向量',
    category: '数学',
    definition: '表示 3D 空间中的位置、方向、速度或缩放量。',
    whyItMatters: '移动、射线、法线、物理速度都离不开向量。',
    related: ['Direction', 'Normal', 'Raycaster']
  },
  {
    id: 'euler',
    term: 'Euler',
    cn: '欧拉角',
    category: '数学',
    definition: '用 x、y、z 三个角度描述旋转。',
    whyItMatters: '直观好调，但可能遇到万向节锁；复杂旋转要知道 Quaternion。',
    related: ['Quaternion', 'Rotation Order']
  },
  {
    id: 'quaternion',
    term: 'Quaternion',
    cn: '四元数',
    category: '数学',
    definition: '更稳定地表示 3D 旋转的数学结构。',
    whyItMatters: '相机插值、骨骼动画和复杂旋转用它更稳，不容易出现旋转抖动。',
    related: ['Euler', 'Slerp', 'Animation']
  },
  {
    id: 'matrix4',
    term: 'Matrix4',
    cn: '四维矩阵',
    category: '数学',
    definition: '同时表达平移、旋转、缩放和投影变换的矩阵。',
    whyItMatters: 'Object3D 的世界变换、相机投影和 shader 坐标变换都在用矩阵。',
    related: ['Model Matrix', 'View Matrix', 'Projection Matrix']
  },
  {
    id: 'buffergeometry',
    term: 'BufferGeometry',
    cn: '缓冲几何体',
    category: '核心',
    definition: '用 typed array 存储顶点、法线、UV、索引等数据的高性能几何体。',
    whyItMatters: '现代 Three.js 的几何基础，性能和自定义形状都靠它。',
    related: ['Attribute', 'Index Buffer', 'Vertex']
  },
  {
    id: 'attribute',
    term: 'Attribute',
    cn: '顶点属性',
    category: '核心',
    definition: '绑定在每个顶点上的数据，例如 position、normal、uv、color。',
    whyItMatters: 'shader 和几何变形都要读这些数据，调错了模型就会破相。',
    related: ['BufferAttribute', 'Shader', 'Normal']
  },
  {
    id: 'normal',
    term: 'Normal',
    cn: '法线',
    category: '核心',
    definition: '描述表面朝向的向量，用于光照计算。',
    whyItMatters: '法线错了，灯光再贵也照不出正常效果。',
    related: ['Lighting', 'Normal Map', 'PBR']
  },
  {
    id: 'uv',
    term: 'UV',
    cn: '贴图坐标',
    category: '核心',
    definition: '把 2D 贴图映射到 3D 模型表面的坐标。',
    whyItMatters: '贴图拉伸、错位、重复，十有八九是 UV 或 wrapping 没处理好。',
    related: ['Texture', 'Wrapping', 'KTX2']
  },
  {
    id: 'texture',
    term: 'Texture',
    cn: '纹理',
    category: '核心',
    definition: '用于颜色、粗糙度、法线、透明度等表面信息的图像或程序数据。',
    whyItMatters: '真实感主要不是靠模型堆面数，而是靠贴图和材质信息配合。',
    related: ['Mipmap', 'Color Space', 'Material']
  },
  {
    id: 'mipmap',
    term: 'Mipmap',
    cn: '多级纹理',
    category: '工程',
    definition: '为同一贴图生成多级尺寸版本，远处采小图，近处采大图。',
    whyItMatters: '减少闪烁并提升采样性能，是纹理优化的基本功。',
    related: ['Texture Filtering', 'KTX2', 'Anisotropy']
  },
  {
    id: 'color-space',
    term: 'Color Space',
    cn: '颜色空间',
    category: '渲染管线',
    definition: '描述颜色数值如何映射到视觉亮度的规则，例如 sRGB 和 Linear。',
    whyItMatters: '颜色空间错了，画面会灰、脏、过曝或材质不真实。',
    related: ['Tone Mapping', 'sRGB', 'Linear']
  },
  {
    id: 'pbr',
    term: 'PBR',
    cn: '基于物理的渲染',
    category: '效果',
    definition: '用 roughness、metalness、envMap 等参数近似真实光照行为。',
    whyItMatters: '调材质从玄学变工程，金属、塑料、玻璃都有规律可循。',
    related: ['Roughness', 'Metalness', 'Environment Map']
  },
  {
    id: 'roughness',
    term: 'Roughness',
    cn: '粗糙度',
    category: '效果',
    definition: '控制材质表面反射的模糊程度。',
    whyItMatters: '粗糙度小像镜面，粗糙度大像哑光，是调质感的核心旋钮。',
    related: ['PBR', 'Metalness', 'Environment Map']
  },
  {
    id: 'metalness',
    term: 'Metalness',
    cn: '金属度',
    category: '效果',
    definition: '控制材质接近金属还是非金属。',
    whyItMatters: '金属材质主要反射环境，非金属材质保留自身颜色。',
    related: ['PBR', 'Roughness', 'Env Map']
  },
  {
    id: 'light',
    term: 'Light',
    cn: '灯光',
    category: '效果',
    definition: '影响材质明暗、阴影和空间层次的光源。',
    whyItMatters: '没有灯光设计，3D 画面很容易像塑料玩具或者黑煤球。',
    related: ['DirectionalLight', 'PointLight', 'AmbientLight']
  },
  {
    id: 'shadow-map',
    term: 'Shadow Map',
    cn: '阴影贴图',
    category: '效果',
    definition: '从光源视角渲染深度图，再判断物体是否处于阴影中。',
    whyItMatters: '阴影能立刻增加空间感，但分辨率、范围和 bias 不调就会出锯齿或痤疮纹。',
    related: ['Light Camera', 'Bias', 'PCFSoftShadowMap']
  },
  {
    id: 'environment-map',
    term: 'Environment Map',
    cn: '环境贴图',
    category: '效果',
    definition: '用于模拟周围环境反射和间接光照的纹理。',
    whyItMatters: 'PBR 材质没有环境贴图，金属和玻璃基本没灵魂。',
    related: ['PBR', 'PMREM', 'IBL']
  },
  {
    id: 'tone-mapping',
    term: 'Tone Mapping',
    cn: '色调映射',
    category: '渲染管线',
    definition: '把 HDR 光照结果压缩到屏幕可显示范围。',
    whyItMatters: '曝光、电影感和高亮细节都靠它，不调就容易白成一片。',
    related: ['Exposure', 'HDR', 'Color Space']
  },
  {
    id: 'orbit-controls',
    term: 'OrbitControls',
    cn: '轨道控制器',
    category: '交互',
    definition: '让用户围绕目标点旋转、缩放和平移观察场景。',
    whyItMatters: '学习和调试 3D 场景时，它是最常用的相机交互方式。',
    related: ['Camera', 'Damping', 'Target']
  },
  {
    id: 'raycaster',
    term: 'Raycaster',
    cn: '射线检测',
    category: '交互',
    definition: '从相机向鼠标方向发出射线，检测命中的 3D 对象。',
    whyItMatters: '点击选中、悬停高亮、拖拽物体都靠它。',
    related: ['Pointer', 'Intersection', 'TransformControls']
  },
  {
    id: 'transform-controls',
    term: 'TransformControls',
    cn: '变换控制器',
    category: '交互',
    definition: '提供类似建模软件的移动、旋转、缩放 gizmo。',
    whyItMatters: '做编辑器、关卡工具和可视化配置时非常关键。',
    related: ['Object3D', 'Raycaster', 'Gizmo']
  },
  {
    id: 'gltf',
    term: 'glTF',
    cn: 'GL 传输格式',
    category: '资产',
    definition: '面向实时渲染的 3D 模型格式，支持网格、材质、贴图和动画。',
    whyItMatters: 'Web 3D 项目最常用的模型交付格式，Three.js 资产链路绕不开它。',
    related: ['GLB', 'GLTFLoader', 'DRACO']
  },
  {
    id: 'glb',
    term: 'GLB',
    cn: '二进制 glTF',
    category: '资产',
    definition: '把 glTF JSON、二进制数据和贴图打包进单个二进制文件。',
    whyItMatters: '线上加载更方便，减少散文件管理成本。',
    related: ['glTF', 'Binary Buffer', 'GLTFLoader']
  },
  {
    id: 'draco',
    term: 'DRACO',
    cn: '网格压缩',
    category: '资产',
    definition: 'Google 提供的几何压缩方案，可显著减小模型体积。',
    whyItMatters: '大模型上网不压缩就是给用户网速上强度，但解码也有成本。',
    related: ['GLTFLoader', 'Geometry Compression', 'Decoder']
  },
  {
    id: 'ktx2',
    term: 'KTX2',
    cn: 'GPU 纹理压缩容器',
    category: '资产',
    definition: '适合 WebGL/WebGPU 的压缩纹理格式，常搭配 Basis Universal。',
    whyItMatters: '贴图内存和下载体积都能降，移动端尤其明显。',
    related: ['Texture', 'BasisU', 'Mipmap']
  },
  {
    id: 'animation-mixer',
    term: 'AnimationMixer',
    cn: '动画混合器',
    category: '动画',
    definition: '控制 glTF 或 Object3D 动画剪辑播放、混合和时间缩放的对象。',
    whyItMatters: '角色 idle、walk、jump 切换不突兀，靠的就是 mixer 和 action。',
    related: ['AnimationClip', 'AnimationAction', 'KeyframeTrack']
  },
  {
    id: 'clip-action',
    term: 'AnimationAction',
    cn: '动画动作',
    category: '动画',
    definition: 'AnimationMixer 中可播放、暂停、淡入淡出的单个动画实例。',
    whyItMatters: '你不是直接播 clip，而是控制 action 的权重、循环和速度。',
    related: ['AnimationMixer', 'Fade', 'Loop']
  },
  {
    id: 'post-processing',
    term: 'Post Processing',
    cn: '后处理',
    category: '效果',
    definition: '场景渲染完成后，再对画面做 bloom、色彩、景深等屏幕空间效果。',
    whyItMatters: '很多高级质感不是模型本身，而是最终成片阶段调出来的。',
    related: ['EffectComposer', 'RenderPass', 'Bloom']
  },
  {
    id: 'effect-composer',
    term: 'EffectComposer',
    cn: '效果合成器',
    category: '效果',
    definition: 'Three.js examples 中串联多个后处理 pass 的工具。',
    whyItMatters: '只用 renderer.render 做不了复杂成片管线。',
    related: ['RenderPass', 'UnrealBloomPass', 'OutputPass']
  },
  {
    id: 'bloom',
    term: 'Bloom',
    cn: '泛光',
    category: '效果',
    definition: '让高亮区域向周围扩散发光的后处理效果。',
    whyItMatters: '科幻、霓虹和能量效果常用，但强度过头就像糊了一层油。',
    related: ['Post Processing', 'Exposure', 'HDR']
  },
  {
    id: 'draw-call',
    term: 'Draw Call',
    cn: '绘制调用',
    category: '优化',
    definition: 'CPU 向 GPU 提交一次绘制命令。',
    whyItMatters: '对象多不一定死，draw call 多才经常让 CPU 先跪。',
    related: ['Instancing', 'Batching', 'renderer.info']
  },
  {
    id: 'instancing',
    term: 'Instancing',
    cn: '实例化渲染',
    category: '优化',
    definition: '用一个几何体和材质绘制大量不同位置/变换的实例。',
    whyItMatters: '草地、粒子、建筑阵列这类重复对象，性能优化第一反应就是它。',
    related: ['InstancedMesh', 'Draw Call', 'Matrix']
  },
  {
    id: 'lod',
    term: 'LOD',
    cn: '细节层次',
    category: '优化',
    definition: '根据距离切换不同复杂度的模型。',
    whyItMatters: '远处还画高模就是浪费，LOD 是大型场景的基本生存技能。',
    related: ['Frustum Culling', 'Geometry', 'Performance']
  },
  {
    id: 'frustum-culling',
    term: 'Frustum Culling',
    cn: '视锥剔除',
    category: '优化',
    definition: '不渲染相机视野外的对象。',
    whyItMatters: '看不见的东西还渲染，显卡听了都想下班。',
    related: ['Camera Frustum', 'Bounding Box', 'LOD']
  },
  {
    id: 'renderer-info',
    term: 'renderer.info',
    cn: '渲染统计',
    category: '优化',
    definition: 'Three.js 提供的运行时统计，包含 calls、triangles、geometries、textures 等。',
    whyItMatters: '优化不能靠玄学，先看指标再下刀。',
    related: ['Draw Call', 'Triangles', 'Dispose']
  },
  {
    id: 'dispose',
    term: 'dispose()',
    cn: '资源释放',
    category: '工程',
    definition: '手动释放 geometry、material、texture、controls、renderer 等 GPU 或事件资源。',
    whyItMatters: 'Three.js 切场景不释放，内存和显存会慢慢涨，最后白屏给你看。',
    related: ['Memory Leak', 'Texture', 'Renderer']
  },
  {
    id: 'shader',
    term: 'Shader',
    cn: '着色器',
    category: '高级',
    definition: '运行在 GPU 上的小程序，控制顶点变换和像素颜色。',
    whyItMatters: '内置材质不够用时，shader 就是你打开自定义效果的大门。',
    related: ['Vertex Shader', 'Fragment Shader', 'Uniform']
  },
  {
    id: 'uniform',
    term: 'Uniform',
    cn: '全局着色器参数',
    category: '高级',
    definition: 'CPU 每帧传给 shader 的全局值，例如时间、颜色、强度。',
    whyItMatters: '可调 shader 效果基本都靠 uniform 控制。',
    related: ['ShaderMaterial', 'GLSL', 'Time']
  },
  {
    id: 'varying',
    term: 'Varying',
    cn: '插值变量',
    category: '高级',
    definition: '从 vertex shader 传给 fragment shader，并在三角形内部插值的数据。',
    whyItMatters: 'UV、法线、渐变色等跨阶段数据都离不开它。',
    related: ['Vertex Shader', 'Fragment Shader', 'Interpolation']
  },
  {
    id: 'vertex-shader',
    term: 'Vertex Shader',
    cn: '顶点着色器',
    category: '高级',
    definition: '处理顶点位置和顶点相关数据的 shader 阶段。',
    whyItMatters: '波浪、水面、粒子变形和模型顶点动画经常在这里做。',
    related: ['Shader', 'Attribute', 'Matrix']
  },
  {
    id: 'fragment-shader',
    term: 'Fragment Shader',
    cn: '片元着色器',
    category: '高级',
    definition: '决定每个像素最终颜色的 shader 阶段。',
    whyItMatters: '渐变、噪声、扫描线、发光和程序材质主要在这里发挥。',
    related: ['Shader', 'Uniform', 'Color']
  },
  {
    id: 'rapier',
    term: 'Rapier',
    cn: '物理引擎',
    category: '高级',
    definition: '高性能物理引擎，可在 Web 中模拟刚体、碰撞和约束。',
    whyItMatters: '真实碰撞别手搓，项目里用成熟物理引擎更稳。',
    related: ['RigidBody', 'Collider', 'Gravity']
  },
  {
    id: 'rigid-body',
    term: 'RigidBody',
    cn: '刚体',
    category: '高级',
    definition: '物理世界中具有质量、速度、位置和旋转的对象。',
    whyItMatters: '物体受力、坠落、碰撞，都是刚体模拟出来的。',
    related: ['Collider', 'Rapier', 'Mass']
  },
  {
    id: 'collider',
    term: 'Collider',
    cn: '碰撞体',
    category: '高级',
    definition: '用于碰撞检测的简化形状，例如球、盒子、胶囊。',
    whyItMatters: '渲染模型可以很复杂，碰撞体应该尽量简单。',
    related: ['RigidBody', 'Collision', 'Physics']
  },
  {
    id: 'webxr',
    term: 'WebXR',
    cn: 'Web 扩展现实',
    category: '高级',
    definition: '浏览器中访问 VR/AR 设备和沉浸式会话的 API。',
    whyItMatters: '想做 VR/AR，就要理解 XR session、controller 和帧循环差异。',
    related: ['XRSession', 'Controller', 'Immersive VR']
  },
  {
    id: 'webgpu',
    term: 'WebGPU',
    cn: '现代 GPU API',
    category: '高级',
    definition: '比 WebGL 更接近现代图形 API 的浏览器 GPU 标准。',
    whyItMatters: '未来大规模计算、复杂材质和现代渲染管线会越来越依赖它。',
    related: ['GPUDevice', 'Render Pipeline', 'WGSL']
  },
  {
    id: 'render-pipeline',
    term: 'Render Pipeline',
    cn: '渲染管线',
    category: '渲染管线',
    definition: '从数据准备、顶点处理、光栅化、片元着色到输出画面的完整流程。',
    whyItMatters: '知道管线顺序，调 shader、后处理和性能才不会瞎蒙。',
    related: ['Shader', 'Post Processing', 'WebGPU']
  },
  {
    id: 'delta-time',
    term: 'Delta Time',
    cn: '帧间隔时间',
    category: '工程',
    definition: '当前帧和上一帧之间经过的时间。',
    whyItMatters: '动画速度要乘 delta time，否则高刷屏和低端机速度完全不一样。',
    related: ['Clock', 'Animation Loop', 'Physics']
  },
  {
    id: 'device-pixel-ratio',
    term: 'Device Pixel Ratio',
    cn: '设备像素比',
    category: '工程',
    definition: 'CSS 像素和真实屏幕像素之间的比例。',
    whyItMatters: '画面清晰度和 GPU 压力都受它影响，不能无脑开到最高。',
    related: ['Renderer', 'Resolution', 'Performance']
  },
  {
    id: 'sprite',
    term: 'Sprite',
    cn: '精灵标签',
    category: '交互',
    definition: '始终面向相机的轻量 2D 平面对象，常用于 3D 标签、热点和标记。',
    whyItMatters: '很多业务项目不是只有模型，还要在模型上挂说明、状态和交互入口。',
    related: ['Camera', 'POI', 'HUD']
  },
  {
    id: 'render-target',
    term: 'RenderTarget',
    cn: '离屏渲染目标',
    category: '渲染管线',
    definition: '把场景渲染到纹理而不是直接渲染到屏幕的对象。',
    whyItMatters: '镜面、小地图、屏幕内屏幕和后处理都离不开离屏渲染。',
    related: ['Texture', 'Framebuffer', 'Post Processing']
  },
  {
    id: 'procedural-generation',
    term: 'Procedural Generation',
    cn: '程序化生成',
    category: '工程',
    definition: '通过算法生成几何、材质、布局或纹理，而不是完全依赖手工资产。',
    whyItMatters: '参数化项目、数据驱动场景和大世界内容都需要程序化思维。',
    related: ['BufferGeometry', 'Noise', 'Instancing']
  },
  {
    id: 'particles',
    term: 'Particles',
    cn: '粒子系统',
    category: '高级',
    definition: '用大量轻量点、精灵或实例表达火花、星空、烟雾、能量等效果。',
    whyItMatters: '粒子是高级视觉效果的常用武器，但数量和材质一失控就会拖性能。',
    related: ['Points', 'Shader', 'Texture']
  },
  {
    id: 'points',
    term: 'Points',
    cn: '点渲染对象',
    category: '高级',
    definition: 'Three.js 中用同一材质批量渲染顶点点集的对象。',
    whyItMatters: '星空、点云和轻量粒子常用 Points 起步，比一堆 Mesh 更省 draw call。',
    related: ['BufferGeometry', 'Particles', 'Draw Call']
  },
  {
    id: 'noise',
    term: 'Noise',
    cn: '噪声函数',
    category: '高级',
    definition: '用于生成平滑随机图案的函数，常见于程序材质、地形和动画扰动。',
    whyItMatters: '火焰、水面、云、溶解和地形变化都可以靠噪声做出自然感。',
    related: ['Shader', 'Uniform', 'Procedural Generation']
  },
  {
    id: 'world-chunk',
    term: 'World Chunk',
    cn: '世界分块',
    category: '优化',
    definition: '把大场景拆成可加载、卸载和降级管理的小块。',
    whyItMatters: '大世界不分块就像把全小区家具都塞进一个屋，加载和渲染都会遭罪。',
    related: ['LOD', 'Frustum Culling', 'Streaming']
  },
  {
    id: 'camera-path',
    term: 'Camera Path',
    cn: '镜头路径',
    category: '交互',
    definition: '用曲线或关键帧控制相机位置、朝向和速度的展示方式。',
    whyItMatters: '产品展示、展厅和作品集需要设计镜头叙事，而不是只靠 OrbitControls 随便转。',
    related: ['Camera', 'CatmullRomCurve3', 'Quaternion']
  },
  {
    id: 'hud',
    term: 'HUD',
    cn: '抬头显示层',
    category: '交互',
    definition: '叠加在 3D 场景上的状态、标签、热点或操作信息。',
    whyItMatters: '业务 3D 项目经常要把 3D 世界和 UI 信息连起来，HUD 是这条桥。',
    related: ['Sprite', 'POI', 'World To Screen']
  },
  {
    id: 'data-mapping',
    term: 'Data Mapping',
    cn: '数据映射',
    category: '工程',
    definition: '把数据值映射为高度、颜色、位置、大小、透明度或动画状态。',
    whyItMatters: '3D 可视化不是把柱子立起来完事，关键是映射关系能不能让人读懂。',
    related: ['Data Visualization', 'Color Space', 'Interaction']
  },
  {
    id: 'capstone',
    term: 'Capstone Project',
    cn: '毕业项目',
    category: '工程',
    definition: '综合前面知识完成的可展示项目，用来证明工程、视觉、性能和交互能力。',
    whyItMatters: '学会 API 只是起步，能交付完整作品才算真正上手。',
    related: ['Architecture', 'Performance Budget', 'Documentation']
  }
];
