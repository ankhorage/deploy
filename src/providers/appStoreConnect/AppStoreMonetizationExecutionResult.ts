import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';

export type AppStoreMonetizationExecutionResult =
  | { readonly status: 'completed'; readonly state: MonetizationTargetState }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };
