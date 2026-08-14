import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';

export interface ProjectReleaseInspection {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
  readonly observed: ReleaseObservedState;
  readonly currentRevision: string;
  readonly actions: readonly DeploymentRequiredAction[];
}
