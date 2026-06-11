import type { LessonModule } from '../types';
import { lessonBlueprints } from './courseBlueprints';
import { createLabScene } from './labScene';

export const lessons: LessonModule[] = lessonBlueprints.map((blueprint) => ({
  meta: blueprint.meta,
  narrative: blueprint.narrative,
  controls: blueprint.controls,
  exercises: blueprint.exercises,
  source: blueprint.source,
  create: (context) => createLabScene({
    kind: blueprint.kind,
    accent: blueprint.accent,
    controls: blueprint.controls
  }, context)
}));
