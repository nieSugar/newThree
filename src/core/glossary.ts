import type { GlossaryTerm } from '../types';

export function searchGlossary(terms: GlossaryTerm[], query: string): GlossaryTerm[] {
  const needle = normalize(query);

  if (!needle) {
    return terms;
  }

  return terms.filter((item) => {
    const haystack = normalize(
      `${item.term} ${item.cn} ${item.category} ${item.definition} ${item.whyItMatters} ${item.related.join(' ')}`
    );
    return haystack.includes(needle);
  });
}

export function getTermsByIds(terms: GlossaryTerm[], ids: string[]): GlossaryTerm[] {
  const wanted = new Set(ids);
  return terms.filter((term) => wanted.has(term.id));
}

export function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('zh-CN');
}
