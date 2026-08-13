import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { AppStoreListingContext } from './AppStoreListingContext';

export type AppStoreListingContextResult =
  | { readonly status: 'completed'; readonly context: AppStoreListingContext }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };
