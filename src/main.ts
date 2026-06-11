import './styles.css';
import { detectCapabilities } from './core/capabilities';
import { evaluateExercise, getCompletedExerciseIds } from './core/exercises';
import { getTermsByIds, searchGlossary } from './core/glossary';
import { createLessonRegistry } from './core/lessonRegistry';
import { ProgressStore, type LearningProgress } from './core/progress';
import { highlightSource } from './core/sourceHighlight';
import { WIKI_ALL_STAGE, getWikiArticleByTermId, getWikiStages, searchWikiArticles } from './core/wiki';
import { glossaryTerms } from './data/glossaryTerms';
import { wikiArticles } from './data/wikiArticles';
import { lessons } from './lessons';
import type {
  ControlValue,
  LabControl,
  LessonInstance,
  LessonMetrics,
  LessonRuntimeState,
  WikiArticle,
  WikiDiagramKind,
  WikiVisual
} from './types';

type AppView = 'lesson' | 'wiki';

interface InitialState {
  view: AppView;
  lessonId: string;
  wikiArticleId: string;
}

const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('Missing #app root.');
}

const root = appRoot;
const registry = createLessonRegistry(lessons);
const progressStore = new ProgressStore(window.localStorage, registry.all[0].meta.id);
const capabilities = detectCapabilities();
const termsById = new Map(glossaryTerms.map((term) => [term.id, term]));
const wikiArticlesByTermId = new Map(wikiArticles.map((article) => [article.termId, article]));
const wikiStages = [WIKI_ALL_STAGE, ...getWikiStages(wikiArticles)];

let progress = progressStore.read();
const initialState = getInitialState(progress);
let activeView: AppView = initialState.view;
let currentLesson = registry.get(initialState.lessonId);
let currentInstance: LessonInstance | undefined;
let currentState: LessonRuntimeState | undefined;
let selectedStage = '全部';
let lessonQuery = '';
let glossaryQuery = '';
let wikiQuery = '';
let selectedWikiStage = WIKI_ALL_STAGE;
let selectedWikiArticleId = initialState.wikiArticleId;
let lastExerciseKey = '';

if (activeView === 'wiki') {
  showWikiArticle(selectedWikiArticleId, false);
} else {
  showLesson(currentLesson.meta.id);
}

window.addEventListener('hashchange', () => {
  const hash = getHash();

  if (hash.startsWith('wiki/')) {
    showWikiArticle(decodeURIComponent(hash.slice('wiki/'.length)), false);
    return;
  }

  if (hash && registry.byId.has(hash)) {
    if (activeView === 'lesson') {
      loadLesson(hash, false);
    } else {
      showLesson(hash, false);
    }
  }
});

function showLesson(id: string, updateHash = true): void {
  activeView = 'lesson';
  currentInstance?.dispose();
  currentInstance = undefined;
  currentState = undefined;
  renderLessonShell();
  loadLesson(id, updateHash);
}

function showWikiArticle(termId: string, updateHash = true): void {
  const article = getWikiArticleByTermId(wikiArticles, termId) ?? wikiArticles[0];
  const shouldRenderShell = activeView !== 'wiki';

  activeView = 'wiki';
  selectedWikiArticleId = article.termId;

  if (updateHash) {
    window.history.replaceState(null, '', `#wiki/${encodeURIComponent(article.termId)}`);
  }

  if (shouldRenderShell) {
    currentInstance?.dispose();
    currentInstance = undefined;
    currentState = undefined;
    renderWikiShell();
    return;
  }

  renderWikiList();
  renderWikiArticle();
}

function renderLessonShell(): void {
  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="课程导航">
        <div class="brand-block">
          <p class="eyebrow">Three.js Lab</p>
          <h1>交互学习站</h1>
          <p class="brand-copy">从 scene 到 WebGPU，把能看、能调、能验收的知识点串起来。</p>
        </div>
        ${renderViewTabs()}
        <div class="progress-block">
          <div class="progress-top">
            <span>学习进度</span>
            <strong data-role="progress-count">0 / ${registry.all.length}</strong>
          </div>
          <div class="progress-track"><span data-role="progress-bar"></span></div>
        </div>
        <label class="field-label" for="lesson-search">课程搜索</label>
        <input id="lesson-search" class="text-input" data-role="lesson-search" type="search" placeholder="scene / shader / 优化" autocomplete="off" />
        <div class="stage-filter" data-role="stage-filter"></div>
        <nav class="lesson-list" data-role="lesson-list"></nav>
      </aside>

      <main class="workspace">
        <section class="lesson-title-band">
          <div>
            <p class="eyebrow" data-role="lesson-stage"></p>
            <h2 data-role="lesson-title"></h2>
            <p data-role="lesson-summary"></p>
          </div>
          <div class="lesson-actions">
            <button class="ghost-button" data-role="prev-lesson" type="button">上一课</button>
            <button class="primary-button" data-role="complete-lesson" type="button">标记完成</button>
            <button class="ghost-button" data-role="next-lesson" type="button">下一课</button>
          </div>
        </section>

        <section class="canvas-section">
          <div class="canvas-host" data-testid="lesson-canvas-host" data-role="canvas-host"></div>
          <div class="runtime-status" data-role="runtime-status">场景初始化中...</div>
        </section>

        <section class="study-grid">
          <article class="study-panel">
            <h3>学习目标</h3>
            <p data-role="lesson-overview"></p>
            <p class="mental-model" data-role="lesson-mental-model"></p>
          </article>
          <article class="study-panel">
            <h3>关键点</h3>
            <ul data-role="lesson-keypoints"></ul>
          </article>
          <article class="study-panel">
            <h3>常见坑</h3>
            <ul data-role="lesson-mistakes"></ul>
          </article>
        </section>
      </main>

      <aside class="inspector" aria-label="实验面板">
        <section class="panel-section metrics-panel">
          <div class="section-heading">
            <h3>性能仪表</h3>
            <span data-role="capability-summary"></span>
          </div>
          <div class="metrics-grid" data-role="metrics-grid"></div>
        </section>

        <section class="panel-section">
          <div class="section-heading">
            <h3>参数面板</h3>
            <span data-role="control-count"></span>
          </div>
          <div class="control-stack" data-role="controls"></div>
        </section>

        <section class="panel-section">
          <div class="section-heading">
            <h3>练习检查</h3>
            <span data-role="exercise-count"></span>
          </div>
          <div class="exercise-stack" data-role="exercises"></div>
        </section>

        <section class="panel-section">
          <div class="section-heading">
            <h3>术语</h3>
            <span data-role="term-count"></span>
          </div>
          <input class="text-input compact" data-role="glossary-search" type="search" placeholder="搜索术语" autocomplete="off" />
          <div class="term-list" data-role="terms"></div>
        </section>

        <section class="panel-section source-panel">
          <div class="section-heading">
            <h3>源码片段</h3>
            <span>TypeScript</span>
          </div>
          <pre><code data-role="source"></code></pre>
        </section>
      </aside>
    </div>
  `;

  attachViewTabs();

  byRole<HTMLInputElement>('lesson-search').value = lessonQuery;
  byRole<HTMLInputElement>('lesson-search').addEventListener('input', (event) => {
    lessonQuery = (event.target as HTMLInputElement).value;
    renderLessonList();
  });

  byRole<HTMLInputElement>('glossary-search').value = glossaryQuery;
  byRole<HTMLInputElement>('glossary-search').addEventListener('input', (event) => {
    glossaryQuery = (event.target as HTMLInputElement).value;
    renderTerms();
  });

  byRole<HTMLButtonElement>('prev-lesson').addEventListener('click', () => {
    const previous = registry.previous(currentLesson.meta.id);
    if (previous) {
      loadLesson(previous.meta.id);
    }
  });

  byRole<HTMLButtonElement>('next-lesson').addEventListener('click', () => {
    const next = registry.next(currentLesson.meta.id);
    if (next) {
      loadLesson(next.meta.id);
    }
  });

  byRole<HTMLButtonElement>('complete-lesson').addEventListener('click', () => {
    progress = progressStore.markLessonCompleted(currentLesson.meta.id);
    renderProgress();
    renderLessonList();
  });

  renderStageFilter();
  renderProgress();
  renderCapabilities();
}

function renderWikiShell(): void {
  root.innerHTML = `
    <div class="app-shell wiki-shell">
      <aside class="sidebar wiki-sidebar" aria-label="Wiki 导航">
        <div class="brand-block">
          <p class="eyebrow">Three.js Wiki</p>
          <h1>图文知识库</h1>
          <p class="brand-copy">把术语、图解、课程和项目判断串成一张可搜索的知识网。</p>
        </div>
        ${renderViewTabs()}
        <label class="field-label" for="wiki-search">Wiki 搜索</label>
        <input id="wiki-search" class="text-input" data-role="wiki-search" type="search" placeholder="shader / 阴影 / WebGPU" autocomplete="off" />
        <div class="stage-filter" data-role="wiki-stage-filter"></div>
        <nav class="wiki-list" data-role="wiki-list"></nav>
      </aside>

      <main class="workspace wiki-workspace" data-role="wiki-detail"></main>
    </div>
  `;

  attachViewTabs();

  byRole<HTMLInputElement>('wiki-search').value = wikiQuery;
  byRole<HTMLInputElement>('wiki-search').addEventListener('input', (event) => {
    wikiQuery = (event.target as HTMLInputElement).value;
    renderWikiList();
  });

  renderWikiStageFilter();
  renderWikiList();
  renderWikiArticle();
}

function renderViewTabs(): string {
  return `
    <div class="view-tabs" aria-label="主视图切换">
      <button class="view-tab ${activeView === 'lesson' ? 'active' : ''}" data-role="lesson-view-tab" type="button">课程</button>
      <button class="view-tab ${activeView === 'wiki' ? 'active' : ''}" data-role="wiki-view-tab" type="button">Wiki</button>
    </div>
  `;
}

function attachViewTabs(): void {
  byRole<HTMLButtonElement>('lesson-view-tab').addEventListener('click', () => showLesson(currentLesson.meta.id));
  byRole<HTMLButtonElement>('wiki-view-tab').addEventListener('click', () => showWikiArticle(selectedWikiArticleId));
}

function loadLesson(id: string, updateHash = true): void {
  currentLesson = registry.get(id);
  progress = progressStore.setCurrentLesson(id);
  lastExerciseKey = '';

  if (updateHash) {
    window.history.replaceState(null, '', `#${id}`);
  }

  currentInstance?.dispose();
  currentInstance = undefined;
  currentState = undefined;

  byRole('lesson-stage').textContent = `${currentLesson.meta.stage} / ${currentLesson.meta.difficulty} / ${currentLesson.meta.estimatedMinutes} 分钟`;
  byRole('lesson-title').textContent = currentLesson.meta.title;
  byRole('lesson-summary').textContent = currentLesson.meta.summary;
  byRole('lesson-overview').textContent = currentLesson.narrative.overview;
  byRole('lesson-mental-model').textContent = currentLesson.narrative.mentalModel;
  byRole('lesson-keypoints').innerHTML = currentLesson.narrative.keyPoints.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  byRole('lesson-mistakes').innerHTML = currentLesson.narrative.commonMistakes.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  byRole('source').innerHTML = highlightSource(currentLesson.source);
  byRole('runtime-status').textContent = '场景初始化中...';

  renderControls();
  renderExercises();
  renderTerms();
  renderLessonList();
  renderProgress();
  updateNavButtons();

  currentInstance = currentLesson.create({
    host: byRole('canvas-host'),
    onMetrics(metrics) {
      renderMetrics(metrics);
    },
    onStateChange(state) {
      currentState = state;
      persistExerciseProgress(state);
      renderExercises();
    },
    setStatus(message) {
      byRole('runtime-status').textContent = message;
    }
  });

  byRole('runtime-status').textContent = '场景已就绪。拖动画布可环绕观察，右侧参数会实时改变画面。';
}

function renderStageFilter(): void {
  const container = byRole('stage-filter');
  const stages = ['全部', ...registry.stages];
  container.innerHTML = '';

  for (const stage of stages) {
    const buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.textContent = stage;
    buttonEl.className = stage === selectedStage ? 'stage-pill active' : 'stage-pill';
    buttonEl.addEventListener('click', () => {
      selectedStage = stage;
      renderStageFilter();
      renderLessonList();
    });
    container.append(buttonEl);
  }
}

function renderWikiStageFilter(): void {
  const container = byRole('wiki-stage-filter');
  container.innerHTML = '';

  for (const stage of wikiStages) {
    const buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.textContent = stage;
    buttonEl.className = stage === selectedWikiStage ? 'stage-pill active' : 'stage-pill';
    buttonEl.addEventListener('click', () => {
      selectedWikiStage = stage;
      renderWikiStageFilter();
      renderWikiList();
    });
    container.append(buttonEl);
  }
}

function renderLessonList(): void {
  const container = byRole('lesson-list');
  const query = lessonQuery.trim().toLocaleLowerCase('zh-CN');
  const filtered = registry.all.filter((lesson) => {
    const matchesStage = selectedStage === '全部' || lesson.meta.stage === selectedStage;
    const haystack = `${lesson.meta.title} ${lesson.meta.summary} ${lesson.meta.tags.join(' ')}`.toLocaleLowerCase('zh-CN');
    return matchesStage && (!query || haystack.includes(query));
  });

  container.innerHTML = '';

  for (const lesson of filtered) {
    const buttonEl = document.createElement('button');
    const completed = progress.completedLessons.includes(lesson.meta.id);
    buttonEl.type = 'button';
    buttonEl.className = [
      'lesson-row',
      lesson.meta.id === currentLesson.meta.id ? 'active' : '',
      completed ? 'completed' : ''
    ].filter(Boolean).join(' ');
    buttonEl.dataset.testid = `lesson-button-${lesson.meta.id}`;
    buttonEl.innerHTML = `
      <span>
        <strong>${escapeHtml(lesson.meta.title)}</strong>
        <small>${escapeHtml(lesson.meta.stage)} · ${escapeHtml(lesson.meta.difficulty)}</small>
      </span>
      <em>${completed ? '完成' : lesson.meta.estimatedMinutes + 'm'}</em>
    `;
    buttonEl.addEventListener('click', () => loadLesson(lesson.meta.id));
    container.append(buttonEl);
  }
}

function renderWikiList(): void {
  const container = byRole('wiki-list');
  const filtered = searchWikiArticles(wikiArticles, wikiQuery, selectedWikiStage);
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">没搜到。换个关键词试试，别跟搜索框硬刚。</p>';
    return;
  }

  for (const article of filtered) {
    const buttonEl = document.createElement('button');
    buttonEl.type = 'button';
    buttonEl.className = [
      'wiki-row',
      article.termId === selectedWikiArticleId ? 'active' : '',
      article.source === 'featured' ? 'featured' : ''
    ].filter(Boolean).join(' ');
    buttonEl.dataset.testid = `wiki-article-${article.termId}`;
    buttonEl.innerHTML = `
      <span>
        <strong>${escapeHtml(article.title)}</strong>
        <small>${escapeHtml(article.stage)} · ${escapeHtml(article.level)}</small>
      </span>
      <em>${article.source === 'featured' ? '深讲' : '速查'}</em>
    `;
    buttonEl.addEventListener('click', () => showWikiArticle(article.termId));
    container.append(buttonEl);
  }
}

function renderControls(): void {
  const container = byRole('controls');
  byRole('control-count').textContent = `${currentLesson.controls.length} 项`;
  container.innerHTML = '';

  for (const control of currentLesson.controls) {
    const row = document.createElement('label');
    row.className = `control-row control-${control.kind}`;
    row.dataset.testid = `control-${control.id}`;
    row.innerHTML = `
      <span class="control-copy">
        <strong>${escapeHtml(control.label)}</strong>
        <small>${escapeHtml(control.help)}</small>
      </span>
      ${renderControlInput(control)}
    `;

    const input = row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('[data-control-input]');
    if (input) {
      input.addEventListener(control.kind === 'button' ? 'click' : 'input', () => {
        updateControlValue(control, input);
      });
    }
    container.append(row);
  }
}

function renderControlInput(control: LabControl): string {
  if (control.kind === 'range') {
    return `
      <span class="range-pack">
        <input data-control-input type="range" min="${control.min}" max="${control.max}" step="${control.step}" value="${control.defaultValue}" />
        <output>${control.defaultValue}${control.unit ?? ''}</output>
      </span>
    `;
  }

  if (control.kind === 'select') {
    const options = control.options ?? [];
    return `
      <select data-control-input>
        ${options.map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === control.defaultValue ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
      </select>
    `;
  }

  if (control.kind === 'toggle') {
    return `<input data-control-input type="checkbox" ${control.defaultValue ? 'checked' : ''} />`;
  }

  if (control.kind === 'color') {
    return `<input data-control-input type="color" value="${control.defaultValue}" />`;
  }

  return `<button data-control-input class="small-button" type="button">${escapeHtml(control.label)}</button>`;
}

function updateControlValue(control: LabControl, input: HTMLInputElement | HTMLSelectElement | HTMLButtonElement): void {
  if (!currentInstance) {
    return;
  }

  let value: ControlValue;

  if (control.kind === 'range') {
    value = Number((input as HTMLInputElement).value);
    const output = input.parentElement?.querySelector('output');
    if (output) {
      output.textContent = `${value}${control.unit ?? ''}`;
    }
  } else if (control.kind === 'toggle') {
    value = (input as HTMLInputElement).checked;
  } else if (control.kind === 'button') {
    value = true;
  } else {
    value = (input as HTMLInputElement | HTMLSelectElement).value;
  }

  currentInstance.updateControls({ [control.id]: value });

  if (control.kind === 'button') {
    window.setTimeout(() => currentInstance?.updateControls({ [control.id]: false }), 0);
  }
}

function renderExercises(): void {
  const container = byRole('exercises');
  const state = currentState ?? currentInstance?.getState();
  const completed = state ? getCompletedExerciseIds(currentLesson.exercises, state) : [];
  byRole('exercise-count').textContent = `${completed.length} / ${currentLesson.exercises.length}`;
  container.innerHTML = '';

  for (const exercise of currentLesson.exercises) {
    const passed = state ? evaluateExercise(exercise, state) : false;
    const item = document.createElement('article');
    item.className = passed ? 'exercise-item passed' : 'exercise-item';
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(exercise.title)}</strong>
        <p>${escapeHtml(exercise.goal)}</p>
        <small>${escapeHtml(exercise.hint)}</small>
      </div>
      <span>${passed ? '通过' : '待做'}</span>
    `;
    container.append(item);
  }
}

function renderTerms(): void {
  const lessonTerms = getTermsByIds(glossaryTerms, currentLesson.meta.terms);
  const terms = glossaryQuery.trim() ? searchGlossary(glossaryTerms, glossaryQuery) : lessonTerms;
  const container = byRole('terms');
  byRole('term-count').textContent = `${terms.length} 条`;
  container.innerHTML = '';

  for (const term of terms) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'term-item term-button';
    item.dataset.testid = `term-link-${term.id}`;
    item.innerHTML = `
      <strong>${escapeHtml(term.term)} <span>${escapeHtml(term.cn)}</span></strong>
      <p>${escapeHtml(term.definition)}</p>
      <small>${escapeHtml(term.whyItMatters)}</small>
    `;
    item.addEventListener('click', () => showWikiArticle(term.id));
    container.append(item);
  }
}

function renderWikiArticle(): void {
  const article = wikiArticlesByTermId.get(selectedWikiArticleId) ?? wikiArticles[0];
  const detail = byRole('wiki-detail');
  selectedWikiArticleId = article.termId;

  detail.innerHTML = `
    <section class="wiki-title-band">
      <div>
        <p class="eyebrow">${escapeHtml(article.stage)} / ${escapeHtml(article.level)} / ${article.source === 'featured' ? '深讲' : '速查'}</p>
        <h2 data-role="wiki-title">${escapeHtml(article.title)}</h2>
        <p>${escapeHtml(article.subtitle)}</p>
      </div>
      <p class="wiki-summary">${escapeHtml(article.summary)}</p>
      <div class="wiki-tag-list">${article.tags.slice(0, 8).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
    </section>

    ${article.visuals.length > 0 ? `<section class="wiki-visual-grid">${article.visuals.map(renderWikiVisual).join('')}</section>` : ''}

    <section class="wiki-section-grid">
      ${article.sections.map((section) => `
        <article class="wiki-section">
          <h3>${escapeHtml(section.title)}</h3>
          <p>${escapeHtml(section.body)}</p>
          <ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>
        </article>
      `).join('')}
    </section>

    <section class="wiki-section wiki-mistakes">
      <h3>常见误区</h3>
      <ul>${article.mistakes.map((mistake) => `<li>${escapeHtml(mistake)}</li>`).join('')}</ul>
    </section>

    <section class="wiki-related-grid">
      <article class="wiki-section">
        <h3>关联课程</h3>
        <div class="link-chip-list">
          ${renderRelatedLessons(article)}
        </div>
      </article>
      <article class="wiki-section">
        <h3>关联术语</h3>
        <div class="link-chip-list">
          ${renderRelatedTerms(article)}
        </div>
      </article>
    </section>
  `;

  detail.querySelectorAll<HTMLButtonElement>('[data-wiki-lesson-id]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => showLesson(buttonEl.dataset.wikiLessonId ?? currentLesson.meta.id));
  });

  detail.querySelectorAll<HTMLButtonElement>('[data-wiki-term-id]').forEach((buttonEl) => {
    buttonEl.addEventListener('click', () => showWikiArticle(buttonEl.dataset.wikiTermId ?? wikiArticles[0].termId));
  });
}

function renderWikiVisual(visual: WikiVisual): string {
  if (visual.kind === 'image' && visual.imageSrc) {
    return `
      <figure class="wiki-visual image-visual">
        <img src="${escapeAttr(visual.imageSrc)}" alt="${escapeAttr(visual.alt)}" loading="lazy" />
        <figcaption>
          <strong>${escapeHtml(visual.title)}</strong>
          <span>${escapeHtml(visual.caption)}</span>
        </figcaption>
      </figure>
    `;
  }

  const diagram = visual.diagram ?? 'scene-graph';

  return `
    <figure class="wiki-visual diagram-visual">
      <div class="wiki-diagram diagram-${escapeAttr(diagram)}" data-testid="wiki-visual-${escapeAttr(diagram)}">
        ${renderWikiDiagram(diagram)}
      </div>
      <figcaption>
        <strong>${escapeHtml(visual.title)}</strong>
        <span>${escapeHtml(visual.caption)}</span>
      </figcaption>
    </figure>
  `;
}

function renderWikiDiagram(kind: WikiDiagramKind): string {
  switch (kind) {
    case 'scene-graph':
      return `
        <div class="diagram-tree">
          <span class="diagram-node root-node">Scene</span>
          <span class="diagram-line"></span>
          <span class="diagram-node">Camera</span>
          <span class="diagram-node">Light</span>
          <span class="diagram-node">Group</span>
          <span class="diagram-node accent-node">Mesh</span>
        </div>
      `;
    case 'camera-frustum':
      return `
        <div class="diagram-frustum">
          <span class="camera-dot">Camera</span>
          <span class="near-plane">near</span>
          <span class="far-plane">far</span>
          <span class="frustum-shape"></span>
          <span class="target-dot">Mesh</span>
        </div>
      `;
    case 'buffer-attributes':
      return `
        <div class="diagram-attributes">
          <span>vertex</span><strong>position</strong><strong>normal</strong><strong>uv</strong>
          <span>0</span><em>x y z</em><em>nx ny nz</em><em>u v</em>
          <span>1</span><em>x y z</em><em>nx ny nz</em><em>u v</em>
          <span>index</span><em>0, 1, 2</em><em>2, 3, 0</em><em>...</em>
        </div>
      `;
    case 'pbr-parameters':
      return `
        <div class="diagram-bars">
          <label><span>roughness</span><i style="--bar: 38%"></i></label>
          <label><span>metalness</span><i style="--bar: 72%"></i></label>
          <label><span>env map</span><i style="--bar: 86%"></i></label>
          <strong>material response</strong>
        </div>
      `;
    case 'light-shadow':
      return `
        <div class="diagram-light">
          <span class="light-source">Light</span>
          <span class="light-beam"></span>
          <span class="lit-object"></span>
          <span class="shadow-shape"></span>
          <span class="ground-line"></span>
        </div>
      `;
    case 'render-pipeline':
      return renderFlow(['CPU data', 'Vertex', 'Raster', 'Fragment', 'Post FX', 'Canvas']);
    case 'shader-flow':
      return renderFlow(['Attribute', 'Vertex Shader', 'Varying', 'Fragment Shader', 'Pixel']);
    case 'performance-budget':
      return `
        <div class="diagram-budget">
          <label><span>CPU calls</span><i style="--bar: 76%"></i></label>
          <label><span>GPU triangles</span><i style="--bar: 58%"></i></label>
          <label><span>Textures</span><i style="--bar: 42%"></i></label>
          <strong>16.6ms frame budget</strong>
        </div>
      `;
    case 'asset-pipeline':
      return renderFlow(['DCC', 'glTF/GLB', 'Compression', 'Loader', 'Scene']);
    default:
      return renderFlow(['Input', 'Process', 'Output']);
  }
}

function renderFlow(items: string[]): string {
  return `
    <div class="diagram-flow">
      ${items.map((item, index) => `
        <span class="${index === items.length - 1 ? 'accent-node' : ''}">${escapeHtml(item)}</span>
        ${index < items.length - 1 ? '<i></i>' : ''}
      `).join('')}
    </div>
  `;
}

function renderRelatedLessons(article: WikiArticle): string {
  const relatedLessons = article.relatedLessonIds.map((lessonId) => registry.byId.get(lessonId)).filter(isDefined);

  if (relatedLessons.length === 0) {
    return '<span class="muted-note">暂无直接关联课程</span>';
  }

  return relatedLessons.map((lesson) => `
    <button class="link-chip" data-wiki-lesson-id="${escapeAttr(lesson.meta.id)}" data-testid="wiki-related-lesson-${escapeAttr(lesson.meta.id)}" type="button">
      ${escapeHtml(lesson.meta.title)}
    </button>
  `).join('');
}

function renderRelatedTerms(article: WikiArticle): string {
  const relatedTerms = article.relatedTermIds.map((termId) => termsById.get(termId)).filter(isDefined);

  if (relatedTerms.length === 0) {
    return '<span class="muted-note">暂无直接关联术语</span>';
  }

  return relatedTerms.map((term) => `
    <button class="link-chip" data-wiki-term-id="${escapeAttr(term.id)}" type="button">
      ${escapeHtml(term.term)} / ${escapeHtml(term.cn)}
    </button>
  `).join('');
}

function renderMetrics(metrics: LessonMetrics): void {
  const rows: Array<[string, number, string]> = [
    ['FPS', metrics.fps, 'fps'],
    ['Calls', metrics.calls, 'calls'],
    ['Triangles', metrics.triangles, 'triangles'],
    ['Geometries', metrics.geometries, 'geometries'],
    ['Textures', metrics.textures, 'textures'],
    ['Objects', metrics.objects, 'objects']
  ];

  byRole('metrics-grid').innerHTML = rows.map(([label, value, testId]) => `
    <div class="metric-cell" data-testid="metrics-${testId}">
      <span>${label}</span>
      <strong>${formatMetric(value)}</strong>
    </div>
  `).join('');
}

function renderProgress(): void {
  const completed = progress.completedLessons.length;
  byRole('progress-count').textContent = `${completed} / ${registry.all.length}`;
  byRole('progress-bar').style.width = `${Math.round((completed / registry.all.length) * 100)}%`;
}

function renderCapabilities(): void {
  byRole('capability-summary').textContent = [
    capabilities.webgl2 ? 'WebGL2' : 'WebGL1',
    capabilities.webgpu ? 'WebGPU 可用' : 'WebGPU fallback',
    capabilities.webxr ? 'WebXR 可用' : 'WebXR fallback'
  ].join(' · ');
}

function persistExerciseProgress(state: LessonRuntimeState): void {
  const completedIds = getCompletedExerciseIds(currentLesson.exercises, state);
  const key = `${currentLesson.meta.id}:${completedIds.join(',')}`;
  if (key === lastExerciseKey) {
    return;
  }

  lastExerciseKey = key;
  progress = progressStore.setCompletedExercises(currentLesson.meta.id, completedIds);

  if (completedIds.length === currentLesson.exercises.length) {
    progress = progressStore.markLessonCompleted(currentLesson.meta.id);
  }

  renderProgress();
  renderLessonList();
}

function updateNavButtons(): void {
  byRole<HTMLButtonElement>('prev-lesson').disabled = !registry.previous(currentLesson.meta.id);
  byRole<HTMLButtonElement>('next-lesson').disabled = !registry.next(currentLesson.meta.id);
}

function getInitialState(savedProgress: LearningProgress): InitialState {
  const hash = getHash();
  const defaultLessonId = registry.byId.has(savedProgress.currentLessonId) ? savedProgress.currentLessonId : registry.all[0].meta.id;

  if (hash.startsWith('wiki/')) {
    const termId = decodeURIComponent(hash.slice('wiki/'.length));
    const article = getWikiArticleByTermId(wikiArticles, termId) ?? wikiArticles[0];
    return {
      view: 'wiki',
      lessonId: defaultLessonId,
      wikiArticleId: article.termId
    };
  }

  if (hash && registry.byId.has(hash)) {
    return {
      view: 'lesson',
      lessonId: hash,
      wikiArticleId: wikiArticles[0].termId
    };
  }

  return {
    view: 'lesson',
    lessonId: defaultLessonId,
    wikiArticleId: wikiArticles[0].termId
  };
}

function getHash(): string {
  return window.location.hash.replace('#', '');
}

function byRole<T extends HTMLElement = HTMLElement>(role: string): T {
  const element = root.querySelector<T>(`[data-role="${role}"]`);
  if (!element) {
    throw new Error(`Missing element with data-role="${role}".`);
  }
  return element;
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
