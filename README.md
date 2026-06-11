# Three.js 交互学习站

这是一个面向小白到进阶学习者的中文 Three.js 实验式课程站。项目采用 Vanilla TypeScript + Vite，不套 React/Vue/R3F，让学习者直接理解 Three.js 本体：scene、camera、renderer、geometry、material、lighting、interaction、assets、animation、postprocessing、optimization、shader、physics、WebXR、WebGPU，以及能落地到作品的工程化项目。

## 启动

```bash
npm install
npm run dev
```

打开 Vite 输出的本地地址后，第一屏就是学习应用：左侧课程导航，中间 Three.js 画布，右侧参数面板、性能仪表、练习检查、术语和源码片段。

## 课程结构

- 入门：Scene、Camera、Renderer、Mesh、Animation Loop。
- 核心：Object3D、Vector3、Euler、Quaternion、Matrix4、BufferGeometry、Attribute。
- 效果：PBR、Texture、Light、Shadow Map、Tone Mapping、Post Processing、Bloom。
- 交互：OrbitControls、Raycaster、TransformControls、拾取、高亮、吸附。
- 资产：glTF / GLB、DRACO、KTX2、包围盒检查、资源释放。
- 优化：renderer.info、draw calls、InstancedMesh、LOD、frustum culling、dispose、texture memory。
- 高级：GLSL ShaderMaterial、RenderTarget、程序材质、粒子、Rapier 物理概念、WebXR、WebGPU capability fallback。
- 项目：产品展示、3D 数据可视化、作品集级 Capstone 场景。

## 学习路线

1. 01-03：先跑通最小 Three.js 闭环，再理解场景图和 BufferGeometry。
2. 04-07：进入真实项目高频区，重点练材质、灯光、相机和交互。
3. 08-12：学习资产、动画、后处理和性能优化，开始知道项目为什么会卡、会糊、会漏资源。
4. 13-15：接触 shader、物理、WebXR 和 WebGPU，知道高级能力的边界和 fallback。
5. 16-23：补工程进阶课，包括生命周期、程序化生成、粒子、RenderTarget、噪声材质、镜头路径、大世界和 HUD。
6. 24-26：做项目实战，把知识组合成产品展示、数据可视化和作品集级毕业项目。

学完这套的目标不是“背完 Three.js 文档”，而是能独立搭一个可交互 3D 页面，能看指标优化性能，能调材质灯光效果，能解释常见专业名词，并且知道遇到复杂项目时应该拆成哪些工程模块。

## 测试

```bash
npm run build
npm run test
npm run test:e2e
```

Vitest 覆盖课程注册、进度存储、术语搜索和练习判定。Playwright 覆盖首页渲染、canvas 非空、切课不累积 canvas、参数控件能推动练习状态。

## 资产策略

当前版本只使用项目内自制几何、程序贴图和运行时生成的练习模型。资产来源与 license 记录在 `public/assets/manifest.json`，后续如加入外部 glTF / GLB，必须补充来源、授权、压缩方式和体积说明。
