import { describe, expect, it } from 'vitest';
import { evaluateExercise, getCompletedExerciseIds } from '../core/exercises';
import type { ExerciseSpec, LessonRuntimeState } from '../types';

const state: LessonRuntimeState = {
  controls: {
    scale: 1.6,
    wireframe: true,
    mode: 'rotate'
  },
  flags: {
    selectedObject: 'pickable-1'
  },
  metrics: {
    fps: 60,
    calls: 4,
    triangles: 1200,
    geometries: 3,
    textures: 2,
    objects: 9
  }
};

describe('exercise evaluation', () => {
  it('evaluates control, flag and metric checks', () => {
    const exercise: ExerciseSpec = {
      id: 'demo',
      title: 'demo',
      goal: 'demo',
      hint: 'demo',
      checks: [
        { source: 'control', key: 'scale', op: 'gte', value: 1.4 },
        { source: 'control', key: 'wireframe', op: 'truthy' },
        { source: 'flag', key: 'selectedObject', op: 'includes', value: 'pickable' },
        { source: 'metric', key: 'calls', op: 'gte', value: 1 }
      ]
    };

    expect(evaluateExercise(exercise, state)).toBe(true);
  });

  it('returns completed exercise ids', () => {
    const exercises: ExerciseSpec[] = [
      {
        id: 'done',
        title: 'done',
        goal: 'done',
        hint: 'done',
        checks: [{ source: 'control', key: 'mode', op: 'eq', value: 'rotate' }]
      },
      {
        id: 'todo',
        title: 'todo',
        goal: 'todo',
        hint: 'todo',
        checks: [{ source: 'metric', key: 'fps', op: 'lte', value: 30 }]
      }
    ];

    expect(getCompletedExerciseIds(exercises, state)).toEqual(['done']);
  });
});
