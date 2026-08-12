import type { AppDeployManifest, AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState, DeploymentObservedTarget } from '../domain/DeploymentCurrentState';

export function getDesiredTarget(
  desired: AppDeployManifest,
  target: AppDeployTargetId,
): DeploymentObservedTarget | null {
  const config = desired.targets[target];
  if (config === undefined || !config.enabled) return null;

  switch (target) {
    case 'web':
      return { target, providers: desired.targets.web?.providers };
    case 'android':
      return {
        target,
        package: desired.targets.android?.package ?? '',
        providers: desired.targets.android?.providers,
      };
    case 'ios':
      return {
        target,
        bundleIdentifier: desired.targets.ios?.bundleIdentifier ?? '',
        providers: desired.targets.ios?.providers,
      };
  }
}

export function getCurrentTarget(
  current: DeploymentCurrentState,
  target: AppDeployTargetId,
): DeploymentObservedTarget | null {
  switch (target) {
    case 'web':
      return current.targets.web === undefined ? null : { target, ...current.targets.web };
    case 'android':
      return current.targets.android === undefined ? null : { target, ...current.targets.android };
    case 'ios':
      return current.targets.ios === undefined ? null : { target, ...current.targets.ios };
  }
}

export function areTargetSnapshotsEqual(
  left: DeploymentObservedTarget,
  right: DeploymentObservedTarget,
): boolean {
  if (left.target !== right.target || !haveSameProviders(left, right)) return false;
  if (left.target === 'web') return right.target === 'web';
  if (left.target === 'android') {
    return right.target === 'android' && left.package === right.package;
  }
  return right.target === 'ios' && left.bundleIdentifier === right.bundleIdentifier;
}

function haveSameProviders(
  left: DeploymentObservedTarget,
  right: DeploymentObservedTarget,
): boolean {
  return (
    left.providers?.build === right.providers?.build &&
    left.providers?.publish === right.providers?.publish
  );
}
