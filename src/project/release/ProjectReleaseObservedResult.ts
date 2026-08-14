import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';

export type ProjectReleaseObservedResult =
  | {
      readonly ok: true;
      readonly observed: ReleaseObservedState;
      readonly actions: readonly DeploymentRequiredAction[];
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };
