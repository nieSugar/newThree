export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface LearningProgress {
  currentLessonId: string;
  completedLessons: string[];
  completedExercises: Record<string, string[]>;
  updatedAt: string;
}

const STORAGE_KEY = 'three-interactive-learning-progress-v1';

export class ProgressStore {
  constructor(
    private readonly storage: StorageLike,
    private readonly defaultLessonId: string
  ) {}

  read(): LearningProgress {
    const raw = this.storage.getItem(STORAGE_KEY);

    if (!raw) {
      return this.createEmpty();
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LearningProgress>;
      return {
        currentLessonId: parsed.currentLessonId ?? this.defaultLessonId,
        completedLessons: parsed.completedLessons ?? [],
        completedExercises: parsed.completedExercises ?? {},
        updatedAt: parsed.updatedAt ?? new Date(0).toISOString()
      };
    } catch {
      return this.createEmpty();
    }
  }

  setCurrentLesson(id: string): LearningProgress {
    const next = { ...this.read(), currentLessonId: id, updatedAt: new Date().toISOString() };
    this.write(next);
    return next;
  }

  markLessonCompleted(id: string): LearningProgress {
    const progress = this.read();
    const completedLessons = unique([...progress.completedLessons, id]);
    const next = { ...progress, completedLessons, updatedAt: new Date().toISOString() };
    this.write(next);
    return next;
  }

  setCompletedExercises(lessonId: string, exerciseIds: string[]): LearningProgress {
    const progress = this.read();
    const next = {
      ...progress,
      completedExercises: {
        ...progress.completedExercises,
        [lessonId]: unique(exerciseIds)
      },
      updatedAt: new Date().toISOString()
    };
    this.write(next);
    return next;
  }

  clear(): LearningProgress {
    const empty = this.createEmpty();
    this.write(empty);
    return empty;
  }

  private createEmpty(): LearningProgress {
    return {
      currentLessonId: this.defaultLessonId,
      completedLessons: [],
      completedExercises: {},
      updatedAt: new Date(0).toISOString()
    };
  }

  private write(progress: LearningProgress): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
