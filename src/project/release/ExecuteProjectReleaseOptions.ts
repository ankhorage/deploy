import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ProjectReleaseInspection } from './ProjectReleaseInspection';

export interface ExecuteProjectReleaseOptions extends ProjectReleaseAccess {
  readonly inspection: ProjectReleaseInspection;
  readonly plan: ReleasePlan;
  readonly executionId: string;
}
