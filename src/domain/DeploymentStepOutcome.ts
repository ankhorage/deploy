import type { DeploymentFailure } from './DeploymentFailure';
import type { DeploymentRequiredAction } from './DeploymentRequiredAction';

export type DeploymentStepOutcome =
  | { readonly status: 'completed' }
  | { readonly status: 'skipped'; readonly reason: string }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly error: DeploymentFailure };
