import { APP_DEPLOY_TARGET_IDS, type AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../domain/DeploymentCurrentState';
import type { DeploymentDesiredRevisions } from '../domain/DeploymentDesiredRevisions';
import type { DeploymentTargetChange } from '../domain/DeploymentTargetChange';
import { areTargetConfigurationsEqual, getCurrentTarget, getDesiredTarget } from './targetSnapshot';

export interface CreateDeploymentChangesInput {
  readonly desired: AppDeployManifest;
  readonly current: DeploymentCurrentState;
  readonly desiredRevisions?: DeploymentDesiredRevisions;
}

export function createDeploymentChanges(
  input: CreateDeploymentChangesInput,
): readonly DeploymentTargetChange[] {
  return APP_DEPLOY_TARGET_IDS.map((target) => {
    const desired = getDesiredTarget(input.desired, target, input.desiredRevisions?.[target]);
    const current = getCurrentTarget(input.current, target);
    return createTargetChange(target, desired, current);
  });
}

function createTargetChange(
  target: DeploymentTargetChange['target'],
  desired: DeploymentTargetChange['desired'],
  current: DeploymentTargetChange['current'],
): DeploymentTargetChange {
  if (desired === null && current === null) {
    return { target, kind: 'none', desired, current, reason: 'already-absent' };
  }
  if (desired !== null && current === null) {
    return { target, kind: 'create', desired, current, reason: 'target-missing' };
  }
  if (desired === null && current !== null) {
    return { target, kind: 'remove', desired, current, reason: 'target-not-desired' };
  }
  if (desired === null || current === null) throw new Error('Unreachable target change state.');
  if (!areTargetConfigurationsEqual(desired, current)) {
    return { target, kind: 'update', desired, current, reason: 'configuration-changed' };
  }
  if (desired.revision !== undefined && desired.revision !== current.revision) {
    return { target, kind: 'update', desired, current, reason: 'revision-changed' };
  }
  return { target, kind: 'none', desired, current, reason: 'already-current' };
}
