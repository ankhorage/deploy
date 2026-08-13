import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';
import type { ProjectMonetizationTargets } from './ProjectMonetizationTargets';

export interface ProjectMonetizationInspection {
  readonly projectRoot: string;
  readonly desired: MonetizationDesiredState;
  readonly targets: ProjectMonetizationTargets;
  readonly states: readonly MonetizationTargetState[];
  readonly currentRevision: string;
  readonly actions: readonly DeploymentRequiredAction[];
}
