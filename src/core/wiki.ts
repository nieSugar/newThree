import type { WikiArticle } from '../types';
import { normalize } from './glossary';

export const WIKI_ALL_STAGE = '全部';

export function searchWikiArticles(articles: WikiArticle[], query: string, stage = WIKI_ALL_STAGE): WikiArticle[] {
  const needle = normalize(query);

  return articles.filter((article) => {
    const matchesStage = stage === WIKI_ALL_STAGE || article.stage === stage;

    if (!matchesStage) {
      return false;
    }

    if (!needle) {
      return true;
    }

    return getWikiSearchText(article).includes(needle);
  });
}

export function getWikiArticleByTermId(articles: WikiArticle[], termId: string): WikiArticle | undefined {
  return articles.find((article) => article.termId === termId);
}

export function getWikiStages(articles: WikiArticle[]): string[] {
  return [...new Set(articles.map((article) => String(article.stage)))];
}

function getWikiSearchText(article: WikiArticle): string {
  return normalize([
    article.title,
    article.subtitle,
    article.stage,
    article.level,
    article.summary,
    ...article.tags,
    ...article.relatedTermIds,
    ...article.relatedLessonIds,
    ...article.sections.flatMap((section) => [section.title, section.body, ...section.bullets]),
    ...article.mistakes,
    ...article.visuals.flatMap((visual) => [visual.title, visual.alt, visual.caption, visual.diagram ?? '', visual.imageSrc ?? ''])
  ].join(' '));
}
