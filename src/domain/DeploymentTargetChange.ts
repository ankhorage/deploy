import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentObservedTarget } from './DeploymentCurrentState';

export const DEPLOYMENT_CHANGE_KINDS = ['create', 'update', 'remove', 'none'] as const;
export type DeploymentChangeKind = (typeof DEPLOYMENT_CHANGE_KINDS)[number];

export const DEPLOYMENT_CHANGE_REASONS = [
  'already-absent',
  'target-missing',
  'target-not-desired',
  'configuration-changed',
  'already-current',
] as const;
export type DeploymentChangeReason = (typeof DEPLOYMENT_CHANGE_REASONS)[number];

export interface DeploymentTargetChange {
  readonly target: AppDeployTargetId;
  readonly kind: DeploymentChangeKind;
  readonly desired: DeploymentObservedTarget | null;
  readonly current: DeploymentObservedTarget | null;
  readonly reason: DeploymentChangeReason;
}
