import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { MonetizationPlan } from '../../domain/monetization/MonetizationPlan';

export interface ProjectMonetizationPlan extends MonetizationPlan {
  readonly actions: readonly DeploymentRequiredAction[];
}
