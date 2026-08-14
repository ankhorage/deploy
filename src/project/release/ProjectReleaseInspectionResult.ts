import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ProjectReleaseInspection } from './ProjectReleaseInspection';

export type ProjectReleaseInspectionResult =
  | { readonly ok: true; readonly inspection: ProjectReleaseInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
