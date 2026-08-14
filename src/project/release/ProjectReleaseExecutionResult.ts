import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ProjectReleaseExecution } from './ProjectReleaseExecution';

export type ProjectReleaseExecutionResult =
  | { readonly ok: true; readonly execution: ProjectReleaseExecution }
  | { readonly ok: false; readonly failure: DeploymentFailure };
