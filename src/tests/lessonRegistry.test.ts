import { describe, expect, it } from 'vitest';
import { createLessonRegistry } from '../core/lessonRegistry';
import { lessons } from '../lessons';

describe('lesson registry', () => {
  it('registers every lesson with unique ids and ordered navigation', () => {
    const registry = createLessonRegistry(lessons);
    const ids = registry.all.map((lesson) => lesson.meta.id);

    expect(ids.length).toBe(26);
    expect(new Set(ids).size).toBe(ids.length);
    expect(registry.get(ids[0]).meta.title).toContain('01.');
    expect(registry.get(ids[ids.length - 1]).meta.title).toContain('26.');
    expect(registry.next(ids[0])?.meta.id).toBe(ids[1]);
    expect(registry.previous(ids[1])?.meta.id).toBe(ids[0]);
  });

  it('requires lessons to include controls, exercises, terms and source', () => {
    for (const lesson of lessons) {
      expect(lesson.controls.length).toBeGreaterThan(0);
      expect(lesson.exercises.length).toBeGreaterThanOrEqual(2);
      expect(lesson.meta.terms.length).toBeGreaterThan(0);
      expect(lesson.source.length).toBeGreaterThan(40);
    }
  });
});
