import type { GlossaryTerm, WikiArticle, WikiArticleLevel, WikiSection, WikiVisual } from '../types';
import { lessonBlueprints } from '../lessons/courseBlueprints';
import { glossaryTerms } from './glossaryTerms';

interface WikiArticleOverride {
  subtitle: string;
  level: WikiArticleLevel;
  summary: string;
  tags: string[];
  sections: WikiSection[];
  visuals: WikiVisual[];
  mistakes: string[];
  relatedLessonIds?: string[];
  relatedTermIds?: string[];
}

const featuredArticleOverrides = {
  scene: {
    subtitle: '把 3D 世界先放进一张场景图里',
    level: '基础',
    summary: 'Scene 是 Three.js 的舞台，也是所有对象、灯光、辅助线和分组最终汇合的地方。学会看 Scene Graph，比死背 API 更能救命。',
    tags: ['scene graph', 'Object3D', '层级', '容器'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'scene-graph',
        title: 'Scene Graph 层级',
        alt: 'Scene 作为根节点，下面挂载 Camera、Light、Group 和 Mesh。',
        caption: '所有可渲染对象最终都要进入场景图，父子关系决定变换如何继承。'
      }
    ],
    sections: [
      {
        title: '核心理解',
        body: 'Scene 不是一个“背景对象”，它更像一棵树的根。Camera 负责看，Renderer 负责画，Mesh、Light、Group 都是挂在这棵树上的节点。',
        bullets: [
          '对象没有 add 到 Scene 或 Scene 的子节点里，就不会参与渲染。',
          '父级 Group 的 position、rotation、scale 会影响所有子对象。',
          '调试复杂项目时，先检查对象是否真的在场景图里。'
        ]
      },
      {
        title: '项目判断',
        body: '小 demo 可以把所有对象直接 add 到 scene，但真实项目最好按功能或业务分组，比如 productRoot、hudRoot、debugRoot。',
        bullets: [
          '分组能让整体移动、隐藏、释放资源更简单。',
          '调试辅助对象和业务对象分开管理，避免上线时忘删。',
          '切换课程或页面时，统一 dispose root 下面的资源。'
        ]
      }
    ],
    mistakes: [
      '只创建 Mesh 不 add 到 scene，最后对着黑屏怀疑人生。',
      '把 Scene 当垃圾桶，所有对象平铺进去，后续定位和释放都费劲。',
      '父级缩放影响子级后，还以为子模型尺寸数据坏了。'
    ],
    relatedLessonIds: ['foundation-scene-camera-renderer', 'object3d-transform-hierarchy'],
    relatedTermIds: ['object3d', 'mesh', 'renderer']
  },
  camera: {
    subtitle: '决定你怎么观察 3D 世界',
    level: '基础',
    summary: 'Camera 不改变模型本身，却能改变用户看到的一切。FOV、aspect、near/far 和投影模式，是 3D 页面观感和稳定性的底盘。',
    tags: ['PerspectiveCamera', 'OrthographicCamera', 'FOV', 'frustum'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'camera-frustum',
        title: 'Camera Frustum',
        alt: '相机视锥从相机位置向外展开，near 和 far 限制可见范围。',
        caption: '视锥内的对象才可能被看到，near/far 设置太随意会带来裁切和深度精度问题。'
      }
    ],
    sections: [
      {
        title: '透视与正交',
        body: 'PerspectiveCamera 更接近人眼，近大远小；OrthographicCamera 更像工程图，尺寸不随距离变化。',
        bullets: [
          '产品展示、游戏视角通常用透视相机。',
          '地图、工程预览、等距场景常用正交相机。',
          '切换投影方式时，要同步更新 controls 的 target 和可视范围。'
        ]
      },
      {
        title: '稳定性细节',
        body: '窗口尺寸变化后，camera.aspect 和 projectionMatrix 必须更新。near/far 也别一把梭设成 0.001 到 999999。',
        bullets: [
          'near 越小、far 越大，深度精度越容易出问题。',
          'FOV 太大会产生强烈畸变，教学 demo 可以夸张，产品页要克制。',
          '自动镜头和 OrbitControls 同时改相机时，要明确谁是控制权老大。'
        ]
      }
    ],
    mistakes: [
      '模型看不见就乱改模型位置，忘了先查相机 near/far。',
      '窗口 resize 只改 renderer size，不改 camera.aspect。',
      'FOV 拉满追求冲击力，结果用户看啥都像变形了。'
    ],
    relatedLessonIds: ['camera-projection-controls', 'camera-path-cinematic'],
    relatedTermIds: ['orbit-controls', 'device-pixel-ratio', 'camera-path']
  },
  buffergeometry: {
    subtitle: '所有模型最后都要落到顶点数据上',
    level: '进阶',
    summary: 'BufferGeometry 是现代 Three.js 几何体的核心。位置、法线、UV、索引这些 attribute，决定了模型形状、光照和贴图如何工作。',
    tags: ['attribute', 'normal', 'uv', 'index buffer'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'buffer-attributes',
        title: 'Buffer Attributes',
        alt: 'position、normal、uv、index 几组数据共同描述一个几何体。',
        caption: 'Geometry 不是一个神秘黑盒，本质上是一批交给 GPU 的 typed array。'
      }
    ],
    sections: [
      {
        title: '数据表思维',
        body: '把 BufferGeometry 想成一张表：每个顶点有 position、normal、uv 等字段，renderer 按这些字段把三角形送进 GPU。',
        bullets: [
          'position 决定顶点在哪里。',
          'normal 决定表面朝向，直接影响光照。',
          'uv 决定贴图如何包到模型表面。'
        ]
      },
      {
        title: '修改几何体',
        body: '手动改 attribute 后，要设置 needsUpdate。涉及光照的形变，还要重新计算 normal。',
        bullets: [
          '动态变形要控制顶点数量，别每帧重建巨大 geometry。',
          '能复用 geometry 就复用，实例化和共享材质能省不少 draw call。',
          '调试贴图错位时，先看 UV，不要只怪图片。'
        ]
      }
    ],
    mistakes: [
      '改了 position 但没设 needsUpdate，数据变了画面没动。',
      '顶点变形后忘记 computeVertexNormals，光照直接翻车。',
      '为了“更圆滑”无脑拉高 segments，移动端先遭殃。'
    ],
    relatedLessonIds: ['geometry-buffer-attributes', 'procedural-city-generation', 'particles-points-buffer'],
    relatedTermIds: ['attribute', 'normal', 'uv', 'mesh']
  },
  pbr: {
    subtitle: '从玄学调材质走向工程调材质',
    level: '进阶',
    summary: 'PBR 用 roughness、metalness、environment map 等参数近似真实光照行为。它不是“颜色好看点”，而是材质可信度的核心。',
    tags: ['material', 'roughness', 'metalness', 'environment map'],
    visuals: [
      {
        kind: 'image',
        imageSrc: '/assets/wiki/pbr-materials.png',
        title: 'PBR 材质封面',
        alt: '不同粗糙度和金属度的材质球在暗色背景中展示反射差异。',
        caption: 'AI 生成封面用于建立材质氛围，具体参数关系仍靠程序化图解说明。'
      },
      {
        kind: 'diagram',
        diagram: 'pbr-parameters',
        title: 'PBR 参数关系',
        alt: 'roughness、metalness 和 environment map 三个参数影响材质观感。',
        caption: '金属感、镜面反射和环境贴图要一起看，单独拉一个参数经常没意义。'
      }
    ],
    sections: [
      {
        title: '材质参数',
        body: 'roughness 控制反射模糊程度，metalness 控制金属属性，envMap 决定反射里有什么。',
        bullets: [
          '低 roughness 会让高光更清晰。',
          '高 metalness 没有环境贴图时，经常显得灰扑扑。',
          '颜色贴图通常用 sRGB，数据贴图通常保持 Linear。'
        ]
      },
      {
        title: '调参顺序',
        body: '先定光照和环境，再调材质。灯光没搭好时硬调 roughness 和 metalness，基本就是摸黑拧螺丝。',
        bullets: [
          '先确认 renderer colorSpace 和 tone mapping。',
          '再确认 HDR/environment map 或 PMREM 是否合理。',
          '最后微调 roughness、metalness、normal map 和 clearcoat。'
        ]
      }
    ],
    mistakes: [
      '把 metalness 当亮度旋钮，拉满以后还嫌不够亮。',
      '忘设 texture.colorSpace，颜色发灰还怪设计稿。',
      '环境贴图缺失时硬做金属材质，效果像一块没睡醒的铁。'
    ],
    relatedLessonIds: ['material-pbr-texture', 'project-product-showcase'],
    relatedTermIds: ['roughness', 'metalness', 'environment-map', 'color-space']
  },
  light: {
    subtitle: '空间感不是模型堆出来的，是光打出来的',
    level: '进阶',
    summary: '灯光决定物体明暗、阴影和空间层次。Three.js 里灯光和材质互相配合，才有可信的 3D 画面。',
    tags: ['DirectionalLight', 'AmbientLight', 'shadow map', 'tone mapping'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'light-shadow',
        title: 'Light 与 Shadow',
        alt: '方向光照向物体并在地面投射阴影。',
        caption: '阴影要同时配置 renderer、light、mesh 和接收面，少一环就没戏。'
      }
    ],
    sections: [
      {
        title: '灯光分工',
        body: 'AmbientLight 提供基础亮度，DirectionalLight 提供方向和阴影，PointLight 更适合局部光源。',
        bullets: [
          '环境光太高会压平层次。',
          '主光角度决定阴影方向和体积感。',
          'PBR 材质非常依赖稳定的环境光照。'
        ]
      },
      {
        title: '阴影链路',
        body: '开启阴影不是一个开关，而是一条链：renderer.shadowMap、light.castShadow、mesh.castShadow、floor.receiveShadow。',
        bullets: [
          'shadow camera 范围太大会让阴影变糊。',
          'bias 过大或过小都会带来奇怪伪影。',
          '移动端要注意阴影贴图尺寸和 draw call 成本。'
        ]
      }
    ],
    mistakes: [
      '只开 renderer.shadowMap，忘了 mesh.castShadow。',
      'AmbientLight 拉太满，画面像一张扁平贴纸。',
      '阴影糊了只加 mapSize，不调 light camera 范围。'
    ],
    relatedLessonIds: ['lighting-shadow-tone', 'material-pbr-texture'],
    relatedTermIds: ['shadow-map', 'tone-mapping', 'environment-map']
  },
  shader: {
    subtitle: '当内置材质不够用时，GPU 小程序就上场了',
    level: '硬核',
    summary: 'Shader 控制顶点如何变换、像素如何上色。它是自定义视觉效果的入口，也是 Three.js 高级能力的分水岭。',
    tags: ['GLSL', 'ShaderMaterial', 'uniform', 'fragment shader'],
    visuals: [
      {
        kind: 'image',
        imageSrc: '/assets/wiki/shader-field.png',
        title: 'Shader 程序材质封面',
        alt: '发光噪声场、网格线和像素碎片构成的抽象 Shader 视觉。',
        caption: 'AI 生成封面用于表达程序材质的视觉方向，具体流程由 Shader Flow 图解释。'
      },
      {
        kind: 'diagram',
        diagram: 'shader-flow',
        title: 'Shader Flow',
        alt: 'Attribute 进入 vertex shader，再通过 varying 进入 fragment shader。',
        caption: 'attribute、uniform、varying 的关系理清后，ShaderMaterial 就没那么吓人了。'
      }
    ],
    sections: [
      {
        title: '两段程序',
        body: 'Vertex Shader 处理顶点位置，Fragment Shader 决定像素颜色。两者之间通过 varying 传递插值数据。',
        bullets: [
          'attribute 是每个顶点自己的数据。',
          'uniform 是 CPU 给 shader 的全局参数。',
          'varying 会在三角形内部自动插值。'
        ]
      },
      {
        title: '工程边界',
        body: 'Shader 很强，但不是把所有逻辑都塞进 GPU。参数要暴露成 uniform，复杂效果要考虑设备性能。',
        bullets: [
          '先写最小可运行 shader，再逐步加效果。',
          '时间、颜色、强度、噪声尺度这类参数适合做成 uniform。',
          '移动端尤其要控制循环、分支和纹理采样。'
        ]
      }
    ],
    mistakes: [
      '把噪声当纯随机，结果画面每帧乱闪。',
      '所有参数写死，后期调效果只能改源码。',
      '一上来就写巨复杂 shader，编译错误和性能问题一起上桌。'
    ],
    relatedLessonIds: ['shader-glsl-uniforms', 'shader-noise-procedural-material', 'webgpu-pipeline-detection'],
    relatedTermIds: ['uniform', 'varying', 'vertex-shader', 'fragment-shader']
  },
  'render-pipeline': {
    subtitle: '从数据准备到最终画面的完整流水线',
    level: '硬核',
    summary: 'Render Pipeline 描述一帧画面从 CPU 数据、顶点处理、光栅化、片元着色到后处理输出的过程。理解它，调 shader 和性能才有方向。',
    tags: ['GPU', 'pipeline', 'post processing', 'WebGPU'],
    visuals: [
      {
        kind: 'image',
        imageSrc: '/assets/wiki/gpu-pipeline.png',
        title: 'GPU 管线封面',
        alt: '几何体沿着发光 GPU 管线流动并生成最终画面。',
        caption: 'AI 生成封面表现现代 GPU 管线氛围，步骤关系由程序化流程图承担。'
      },
      {
        kind: 'diagram',
        diagram: 'render-pipeline',
        title: 'Render Pipeline',
        alt: 'CPU 准备数据后经过 vertex、raster、fragment、post processing 输出画面。',
        caption: '每一帧都沿着这条链走，问题出在哪一段，优化方式完全不同。'
      }
    ],
    sections: [
      {
        title: '一帧发生了什么',
        body: 'CPU 准备对象、材质和 uniform，GPU 处理顶点、生成片元、计算颜色，最后可能再经过后处理合成到屏幕。',
        bullets: [
          'draw call 多通常是 CPU 提交压力。',
          '三角形和像素复杂度高通常是 GPU 压力。',
          '后处理 pass 会额外消耗 render target 和全屏绘制。'
        ]
      },
      {
        title: '定位问题',
        body: '性能优化先定位瓶颈，不要一上来乱删效果。renderer.info、帧率和设备能力一起看。',
        bullets: [
          'calls 高，优先考虑合批、实例化和材质复用。',
          'triangles 高，优先考虑 LOD、简模和裁剪。',
          '后处理重，优先降低分辨率或减少 pass。'
        ]
      }
    ],
    mistakes: [
      '一掉帧就怪模型，没看 draw call、shader 和后处理。',
      '把 WebGPU 当自动性能魔法，忘了管线设计仍然重要。',
      '后处理无限叠，最后画面和帧率一起糊。'
    ],
    relatedLessonIds: ['postprocessing-composer-bloom', 'webgpu-pipeline-detection', 'optimization-renderer-info'],
    relatedTermIds: ['shader', 'post-processing', 'renderer-info', 'webgpu']
  },
  'draw-call': {
    subtitle: 'CPU 向 GPU 提交绘制命令的成本',
    level: '进阶',
    summary: 'Draw Call 是 CPU 给 GPU 下达一次绘制命令。对象数量不一定致命，但 draw call 多，经常会先把 CPU 提交阶段拖垮。',
    tags: ['performance', 'instancing', 'batching', 'renderer.info'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'performance-budget',
        title: 'Performance Budget',
        alt: 'CPU 提交、GPU 绘制、内存三类预算共同限制帧率。',
        caption: '优化要看预算花在哪儿，不然就是闭眼拆墙。'
      }
    ],
    sections: [
      {
        title: '为什么它贵',
        body: '每次 draw call 都涉及状态切换和提交成本。大量小 Mesh、不同材质、不同纹理都会增加压力。',
        bullets: [
          '同材质重复对象适合 InstancedMesh。',
          '静态小物件可以考虑合并 geometry。',
          '频繁切材质和纹理会让提交更碎。'
        ]
      },
      {
        title: '怎么判断',
        body: 'renderer.info.render.calls 能快速看到绘制调用数量。它不是唯一指标，但非常适合做第一轮体检。',
        bullets: [
          'calls 高但 triangles 不高，多半是提交碎。',
          'triangles 高但 calls 不高，多半是几何复杂。',
          '纹理多、render target 多，还要看显存和带宽。'
        ]
      }
    ],
    mistakes: [
      '只盯 FPS，不看 calls 和 triangles。',
      '几百个同款 Mesh 不实例化，CPU 直接忙成陀螺。',
      '把所有东西合并，结果交互选择和剔除又没法做。'
    ],
    relatedLessonIds: ['optimization-renderer-info', 'procedural-city-generation', 'particles-points-buffer'],
    relatedTermIds: ['instancing', 'renderer-info', 'lod', 'frustum-culling']
  },
  gltf: {
    subtitle: 'Web 3D 最常见的模型交付格式',
    level: '进阶',
    summary: 'glTF 面向实时渲染，能携带网格、材质、贴图和动画。Three.js 项目里的资产链路，大多数绕不开它。',
    tags: ['GLTFLoader', 'GLB', 'DRACO', 'KTX2'],
    visuals: [
      {
        kind: 'diagram',
        diagram: 'asset-pipeline',
        title: 'Asset Pipeline',
        alt: 'DCC 工具导出 glTF/GLB，经压缩和加载器进入 Three.js Scene。',
        caption: '模型上线不是“拖进项目就完事”，格式、压缩、贴图和授权都要管。'
      }
    ],
    sections: [
      {
        title: '格式定位',
        body: 'glTF 像实时 3D 的交付清单，GLB 则把 JSON、二进制和贴图打包成单文件，线上加载更方便。',
        bullets: [
          'GLB 适合减少散文件管理成本。',
          'DRACO 主要压缩几何体，能减小下载体积。',
          'KTX2/BasisU 主要压缩纹理，能降低显存和带宽压力。'
        ]
      },
      {
        title: '工程链路',
        body: '真实项目要管理模型来源、压缩策略、加载状态、错误 fallback 和资源释放。',
        bullets: [
          '加载器配置 decoder 路径要稳定。',
          '模型尺寸、轴向和层级最好在导出前规范。',
          '卸载页面时要 dispose geometry、material 和 texture。'
        ]
      }
    ],
    mistakes: [
      '只压模型不压贴图，下载小了显存还是爆。',
      '模型来源和授权不记录，项目上线前开始补锅。',
      'GLTFLoader 加完就不管，页面切换后资源越堆越多。'
    ],
    relatedLessonIds: ['assets-gltf-pipeline', 'lifecycle-dispose-memory'],
    relatedTermIds: ['glb', 'draco', 'ktx2', 'dispose']
  },
  webgpu: {
    subtitle: '现代浏览器 GPU 能力的新入口',
    level: '硬核',
    summary: 'WebGPU 比 WebGL 更贴近现代图形 API，适合复杂渲染和 GPU 计算。但它不是一键变快，能力检测、fallback 和管线理解都得跟上。',
    tags: ['WebGPU', 'GPUDevice', 'WGSL', 'fallback'],
    visuals: [
      {
        kind: 'image',
        imageSrc: '/assets/wiki/gpu-pipeline.png',
        title: 'WebGPU 管线封面',
        alt: '现代 GPU 管线的抽象技术插图。',
        caption: 'WebGPU 能打开更现代的能力，但仍需要清晰的渲染管线和兼容策略。'
      },
      {
        kind: 'diagram',
        diagram: 'render-pipeline',
        title: 'WebGPU Pipeline',
        alt: '现代 GPU 渲染管线从数据到 shader 再到输出。',
        caption: '从 WebGL 迁到 WebGPU，本质上是更显式地管理管线、资源和状态。'
      }
    ],
    sections: [
      {
        title: '能力边界',
        body: 'WebGPU 提供更现代的资源绑定、计算能力和管线配置，但浏览器和设备支持仍要检测。',
        bullets: [
          'navigator.gpu 不存在时必须 fallback。',
          'WebGPU 适合大规模粒子、计算和现代材质管线。',
          '学习阶段先理解 pipeline，再追求复杂效果。'
        ]
      },
      {
        title: '迁移判断',
        body: '不是所有项目都该马上切 WebGPU。已有 WebGL 项目如果性能瓶颈不在 API 层，迁移收益可能有限。',
        bullets: [
          '需要 GPU compute 时，WebGPU 更有吸引力。',
          '商业项目要考虑浏览器覆盖和降级体验。',
          'Three.js 的 WebGPU 能力在演进中，接口变化也要关注。'
        ]
      }
    ],
    mistakes: [
      '把 WebGPU 当性能灵丹妙药，没做瓶颈分析。',
      '只在自己机器上能跑，不做能力检测和 fallback。',
      '忽略 WebGPU 学习曲线，直接硬改生产项目。'
    ],
    relatedLessonIds: ['webgpu-pipeline-detection', 'particles-points-buffer', 'shader-glsl-uniforms'],
    relatedTermIds: ['render-pipeline', 'shader', 'renderer-info']
  }
} satisfies Record<string, WikiArticleOverride>;

const featuredArticleOverridesById: Record<string, WikiArticleOverride> = featuredArticleOverrides;

export const featuredWikiTermIds = Object.keys(featuredArticleOverridesById);

const lessonIds = new Set(lessonBlueprints.map((lesson) => lesson.meta.id));
const lessonIdsByTerm = createLessonIdsByTerm();
const termLookup = createTermLookup();

export const wikiArticles: WikiArticle[] = glossaryTerms.map((term) => createWikiArticle(term));

function createWikiArticle(term: GlossaryTerm): WikiArticle {
  const override = featuredArticleOverridesById[term.id];
  const baseRelatedTermIds = resolveRelatedTermIds(term);
  const baseRelatedLessonIds = lessonIdsByTerm.get(term.id) ?? [];

  if (!override) {
    return {
      id: term.id,
      termId: term.id,
      title: `${term.term} / ${term.cn}`,
      subtitle: `${term.category}知识点`,
      stage: term.category,
      level: inferLevel(term.category),
      summary: term.definition,
      tags: unique([term.term, term.cn, String(term.category), ...term.related]),
      sections: [
        {
          title: '是什么',
          body: term.definition,
          bullets: [term.whyItMatters]
        },
        {
          title: '怎么学',
          body: '先在关联课程里观察它如何影响画面，再回来看术语解释，会比纯背概念更稳。',
          bullets: buildLearningBullets(term, baseRelatedTermIds, baseRelatedLessonIds)
        }
      ],
      visuals: [],
      mistakes: [
        '只记住英文名，不知道它在场景里负责什么。',
        '看到相关 API 就硬套，没先理解它和其他概念的关系。'
      ],
      relatedTermIds: baseRelatedTermIds,
      relatedLessonIds: baseRelatedLessonIds,
      source: 'glossary'
    };
  }

  return {
    id: term.id,
    termId: term.id,
    title: `${term.term} / ${term.cn}`,
    subtitle: override.subtitle,
    stage: term.category,
    level: override.level,
    summary: override.summary,
    tags: unique([term.term, term.cn, String(term.category), ...term.related, ...override.tags]),
    sections: override.sections,
    visuals: override.visuals,
    mistakes: override.mistakes,
    relatedTermIds: unique([...(override.relatedTermIds ?? []), ...baseRelatedTermIds]),
    relatedLessonIds: unique([...(override.relatedLessonIds ?? []), ...baseRelatedLessonIds]).filter((id) => lessonIds.has(id)),
    source: 'featured'
  };
}

function createLessonIdsByTerm(): Map<string, string[]> {
  const result = new Map<string, string[]>();

  for (const lesson of lessonBlueprints) {
    for (const termId of lesson.meta.terms) {
      const lessonIds = result.get(termId) ?? [];
      lessonIds.push(lesson.meta.id);
      result.set(termId, lessonIds);
    }
  }

  return result;
}

function createTermLookup(): Map<string, string> {
  const result = new Map<string, string>();

  for (const term of glossaryTerms) {
    result.set(normalize(term.id), term.id);
    result.set(normalize(term.term), term.id);
    result.set(normalize(term.cn), term.id);
  }

  return result;
}

function resolveRelatedTermIds(term: GlossaryTerm): string[] {
  return unique(term.related.map((related) => termLookup.get(normalize(related))).filter(isDefined));
}

function buildLearningBullets(term: GlossaryTerm, relatedTermIds: string[], relatedLessonIds: string[]): string[] {
  const bullets = [
    `先理解它为什么重要：${term.whyItMatters}`,
    relatedTermIds.length > 0 ? `再串联相关概念：${relatedTermIds.join('、')}。` : '再找一个实际场景，观察它对画面的影响。',
    relatedLessonIds.length > 0 ? '最后回到关联课程，通过调参验证这个概念。' : '最后用一个小 demo 验证这个概念，不要停在定义层面。'
  ];

  return bullets;
}

function inferLevel(category: GlossaryTerm['category']): WikiArticleLevel {
  if (category === '高级' || category === '渲染管线') {
    return '硬核';
  }

  if (category === '核心' || category === '效果' || category === '优化' || category === '工程') {
    return '进阶';
  }

  return '基础';
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('zh-CN');
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
