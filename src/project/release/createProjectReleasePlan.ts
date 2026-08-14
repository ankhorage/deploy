import { createReleasePlan } from '../../domain/release/createReleasePlan';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ProjectReleaseInspection } from './ProjectReleaseInspection';

export function createProjectReleasePlan(inspection: ProjectReleaseInspection): ReleasePlan {
  return createReleasePlan(inspection.desired, inspection.observed);
}
