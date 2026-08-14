import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { ReleaseObservedTargetState } from '../../domain/release/ReleaseObservedTargetState';

export type ProjectReleaseTargetInspection =
  | {
      readonly ok: true;
      readonly state: ReleaseObservedTargetState;
      readonly actions: readonly DeploymentRequiredAction[];
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };
