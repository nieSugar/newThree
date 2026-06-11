import type { ControlValue, ExerciseCheck, ExerciseSpec, LessonRuntimeState } from '../types';

export function evaluateCheck(check: ExerciseCheck, state: LessonRuntimeState): boolean {
  const value = readValue(check, state);

  switch (check.op) {
    case 'eq':
      return value === check.value;
    case 'neq':
      return value !== check.value;
    case 'gte':
      return Number(value) >= Number(check.value);
    case 'lte':
      return Number(value) <= Number(check.value);
    case 'truthy':
      return Boolean(value);
    case 'includes':
      return String(value).includes(String(check.value));
    default:
      return false;
  }
}

export function evaluateExercise(exercise: ExerciseSpec, state: LessonRuntimeState): boolean {
  return exercise.checks.every((check) => evaluateCheck(check, state));
}

export function getCompletedExerciseIds(
  exercises: ExerciseSpec[],
  state: LessonRuntimeState
): string[] {
  return exercises.filter((exercise) => evaluateExercise(exercise, state)).map((exercise) => exercise.id);
}

function readValue(check: ExerciseCheck, state: LessonRuntimeState): ControlValue | undefined {
  if (check.source === 'control') {
    return state.controls[check.key];
  }

  if (check.source === 'flag') {
    return state.flags[check.key];
  }

  return state.metrics[check.key as keyof LessonRuntimeState['metrics']];
}
