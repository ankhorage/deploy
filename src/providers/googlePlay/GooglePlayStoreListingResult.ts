import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { StoreListingTargetState } from '../../domain/storeListing/StoreListingTargetState';

export type GooglePlayStoreListingInspectionResult =
  | { readonly status: 'completed'; readonly state: StoreListingTargetState }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };
