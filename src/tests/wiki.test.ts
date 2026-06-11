import { describe, expect, it } from 'vitest';
import { WIKI_ALL_STAGE, searchWikiArticles } from '../core/wiki';
import { glossaryTerms } from '../data/glossaryTerms';
import { featuredWikiTermIds, wikiArticles } from '../data/wikiArticles';

describe('wiki articles', () => {
  it('covers every glossary term with a wiki article', () => {
    const glossaryIds = glossaryTerms.map((term) => term.id).sort();
    const articleTermIds = wikiArticles.map((article) => article.termId).sort();

    expect(articleTermIds).toEqual(glossaryIds);
    expect(wikiArticles.length).toBe(66);
  });

  it('searches English, Chinese, stage and related text', () => {
    expect(searchWikiArticles(wikiArticles, 'shader', WIKI_ALL_STAGE).some((article) => article.termId === 'shader')).toBe(true);
    expect(searchWikiArticles(wikiArticles, '阴影', WIKI_ALL_STAGE).some((article) => article.termId === 'shadow-map')).toBe(true);
    expect(searchWikiArticles(wikiArticles, 'WebGPU', '高级').some((article) => article.termId === 'webgpu')).toBe(true);
    expect(searchWikiArticles(wikiArticles, 'PCFSoftShadowMap', WIKI_ALL_STAGE).some((article) => article.termId === 'shadow-map')).toBe(true);
  });

  it('keeps featured deep-dive articles visually and pedagogically complete', () => {
    expect(featuredWikiTermIds).toEqual([
      'scene',
      'camera',
      'buffergeometry',
      'pbr',
      'light',
      'shader',
      'render-pipeline',
      'draw-call',
      'gltf',
      'webgpu'
    ]);

    for (const termId of featuredWikiTermIds) {
      const article = wikiArticles.find((candidate) => candidate.termId === termId);

      expect(article, termId).toBeDefined();
      expect(article?.source).toBe('featured');
      expect(article?.visuals.length).toBeGreaterThanOrEqual(1);
      expect(article?.sections.length).toBeGreaterThanOrEqual(2);
      expect(article?.relatedLessonIds.length).toBeGreaterThanOrEqual(1);
    }
  });
});
