import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';
import type { ProjectMonetizationPlan } from './ProjectMonetizationPlan';

export type ProjectMonetizationExecutionResult =
  | {
      readonly status: 'completed';
      readonly inspection: ProjectMonetizationInspection;
      readonly plan: ProjectMonetizationPlan;
    }
  | { readonly status: 'action-required'; readonly actions: readonly DeploymentRequiredAction[] }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };
