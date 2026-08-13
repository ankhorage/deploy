import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';

export interface AppStoreConnectPublication {
  readonly buildId: string;
  readonly versionId: string;
  readonly buildNumber: string;
  readonly version: string;
}

export type AppStoreConnectPublicationResult =
  | { readonly status: 'completed'; readonly publication: AppStoreConnectPublication }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };
