import type { LessonModule, LessonStage } from '../types';

export interface LessonRegistry {
  all: LessonModule[];
  byId: Map<string, LessonModule>;
  stages: LessonStage[];
  get: (id: string) => LessonModule;
  next: (id: string) => LessonModule | undefined;
  previous: (id: string) => LessonModule | undefined;
}

export function createLessonRegistry(lessons: LessonModule[]): LessonRegistry {
  if (lessons.length === 0) {
    throw new Error('Lesson registry cannot be empty.');
  }

  const byId = new Map<string, LessonModule>();

  for (const lesson of lessons) {
    if (byId.has(lesson.meta.id)) {
      throw new Error(`Duplicate lesson id: ${lesson.meta.id}`);
    }
    byId.set(lesson.meta.id, lesson);
  }

  const stages = [...new Set(lessons.map((lesson) => lesson.meta.stage))];

  return {
    all: lessons,
    byId,
    stages,
    get(id: string) {
      const lesson = byId.get(id);
      if (!lesson) {
        throw new Error(`Unknown lesson id: ${id}`);
      }
      return lesson;
    },
    next(id: string) {
      const index = lessons.findIndex((lesson) => lesson.meta.id === id);
      return index >= 0 ? lessons[index + 1] : undefined;
    },
    previous(id: string) {
      const index = lessons.findIndex((lesson) => lesson.meta.id === id);
      return index > 0 ? lessons[index - 1] : undefined;
    }
  };
}
