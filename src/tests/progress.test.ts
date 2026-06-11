import { describe, expect, it } from 'vitest';
import { ProgressStore, type StorageLike } from '../core/progress';

class MemoryStorage implements StorageLike {
  private readonly data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe('progress store', () => {
  it('starts with a default lesson and persists current lesson', () => {
    const store = new ProgressStore(new MemoryStorage(), 'lesson-a');

    expect(store.read().currentLessonId).toBe('lesson-a');
    expect(store.setCurrentLesson('lesson-b').currentLessonId).toBe('lesson-b');
    expect(store.read().currentLessonId).toBe('lesson-b');
  });

  it('deduplicates completed lessons and exercises', () => {
    const store = new ProgressStore(new MemoryStorage(), 'lesson-a');

    store.markLessonCompleted('lesson-a');
    store.markLessonCompleted('lesson-a');
    store.setCompletedExercises('lesson-a', ['a', 'a', 'b']);

    const progress = store.read();
    expect(progress.completedLessons).toEqual(['lesson-a']);
    expect(progress.completedExercises['lesson-a']).toEqual(['a', 'b']);
  });
});
