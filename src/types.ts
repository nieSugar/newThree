export type LessonStage =
  | '入门'
  | '核心'
  | '效果'
  | '交互'
  | '资产'
  | '动画'
  | '优化'
  | '高级';

export type LessonDifficulty = '小白友好' | '进阶' | '硬核';

export type LessonKind =
  | 'foundation'
  | 'object3d'
  | 'geometry'
  | 'material'
  | 'lighting'
  | 'camera'
  | 'interaction'
  | 'assets'
  | 'animation'
  | 'postprocessing'
  | 'optimization'
  | 'shader'
  | 'lifecycle'
  | 'procedural'
  | 'particles'
  | 'rendertarget'
  | 'shaderNoise'
  | 'cameraPath'
  | 'world'
  | 'hud'
  | 'product'
  | 'dataviz'
  | 'portfolio'
  | 'physics'
  | 'webxr'
  | 'webgpu';

export type LabControlKind = 'range' | 'select' | 'toggle' | 'color' | 'button';
export type ControlValue = number | string | boolean;

export interface LabControlOption {
  label: string;
  value: string;
}

export interface LabControl {
  id: string;
  label: string;
  kind: LabControlKind;
  defaultValue: ControlValue;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: LabControlOption[];
  help: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  cn: string;
  category: LessonStage | '数学' | '工程' | '渲染管线';
  definition: string;
  whyItMatters: string;
  related: string[];
}

export type WikiArticleLevel = '基础' | '进阶' | '硬核';

export type WikiDiagramKind =
  | 'scene-graph'
  | 'camera-frustum'
  | 'buffer-attributes'
  | 'pbr-parameters'
  | 'light-shadow'
  | 'render-pipeline'
  | 'shader-flow'
  | 'performance-budget'
  | 'asset-pipeline';

export interface WikiVisual {
  kind: 'diagram' | 'image';
  title: string;
  alt: string;
  caption: string;
  diagram?: WikiDiagramKind;
  imageSrc?: string;
}

export interface WikiSection {
  title: string;
  body: string;
  bullets: string[];
}

export interface WikiArticle {
  id: string;
  termId: string;
  title: string;
  subtitle: string;
  stage: GlossaryTerm['category'];
  level: WikiArticleLevel;
  summary: string;
  tags: string[];
  sections: WikiSection[];
  visuals: WikiVisual[];
  mistakes: string[];
  relatedTermIds: string[];
  relatedLessonIds: string[];
  source: 'glossary' | 'featured';
}

export type ExerciseOperator = 'eq' | 'neq' | 'gte' | 'lte' | 'truthy' | 'includes';

export interface ExerciseCheck {
  source: 'control' | 'flag' | 'metric';
  key: string;
  op: ExerciseOperator;
  value?: ControlValue;
}

export interface ExerciseSpec {
  id: string;
  title: string;
  goal: string;
  hint: string;
  checks: ExerciseCheck[];
}

export interface LessonMeta {
  id: string;
  title: string;
  stage: LessonStage;
  difficulty: LessonDifficulty;
  estimatedMinutes: number;
  summary: string;
  tags: string[];
  terms: string[];
}

export interface LessonNarrative {
  overview: string;
  mentalModel: string;
  keyPoints: string[];
  commonMistakes: string[];
}

export interface LessonMetrics {
  fps: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  objects: number;
}

export interface LessonRuntimeState {
  controls: Record<string, ControlValue>;
  flags: Record<string, ControlValue>;
  metrics: LessonMetrics;
}

export interface LessonContext {
  host: HTMLElement;
  onMetrics: (metrics: LessonMetrics) => void;
  onStateChange: (state: LessonRuntimeState) => void;
  setStatus: (message: string) => void;
}

export interface LessonInstance {
  updateControls: (values: Record<string, ControlValue>) => void;
  getState: () => LessonRuntimeState;
  dispose: () => void;
}

export interface LessonModule {
  meta: LessonMeta;
  narrative: LessonNarrative;
  controls: LabControl[];
  exercises: ExerciseSpec[];
  source: string;
  create: (context: LessonContext) => LessonInstance;
}
