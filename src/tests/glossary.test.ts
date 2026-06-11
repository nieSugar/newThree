import { describe, expect, it } from 'vitest';
import { getTermsByIds, searchGlossary } from '../core/glossary';
import { glossaryTerms } from '../data/glossaryTerms';

describe('glossary', () => {
  it('searches English and Chinese text', () => {
    expect(searchGlossary(glossaryTerms, 'shader').some((term) => term.id === 'shader')).toBe(true);
    expect(searchGlossary(glossaryTerms, '阴影').some((term) => term.id === 'shadow-map')).toBe(true);
  });

  it('returns terms by ids in glossary order', () => {
    const terms = getTermsByIds(glossaryTerms, ['renderer', 'scene']);
    expect(terms.map((term) => term.id)).toEqual(['scene', 'renderer']);
  });
});
