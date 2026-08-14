import type { DeploymentFailure, ReleasePlan } from '../index.js';
import type { ProjectReleaseAccess, ProjectReleaseInspection } from '../project/index.js';

export type DeployCliInspectionResult =
  | {
      readonly ok: true;
      readonly access: ProjectReleaseAccess;
      readonly inspection: ProjectReleaseInspection;
      readonly plan: ReleasePlan;
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };
