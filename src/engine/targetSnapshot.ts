import type {
  AppDeployAndroidTargetConfig,
  AppDeployIosTargetConfig,
  AppDeployManifest,
  AppDeployTargetId,
  AppDeployWebTargetConfig,
} from '@ankhorage/contracts/deploy';

import type {
  DeploymentCurrentState,
  DeploymentObservedTarget,
} from '../domain/DeploymentCurrentState';

export function getDesiredTarget(
  desired: AppDeployManifest,
  target: AppDeployTargetId,
): DeploymentObservedTarget | null {
  switch (target) {
    case 'web':
      return desiredWebTarget(desired.targets.web);
    case 'android':
      return desiredAndroidTarget(desired.targets.android);
    case 'ios':
      return desiredIosTarget(desired.targets.ios);
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

function desiredWebTarget(
  config: AppDeployWebTargetConfig | undefined,
): DeploymentObservedTarget | null {
  return config?.enabled === true ? { target: 'web', providers: config.providers } : null;
}

function desiredAndroidTarget(
  config: AppDeployAndroidTargetConfig | undefined,
): DeploymentObservedTarget | null {
  return config?.enabled === true
    ? { target: 'android', package: config.package, providers: config.providers }
    : null;
}

function desiredIosTarget(
  config: AppDeployIosTargetConfig | undefined,
): DeploymentObservedTarget | null {
  return config?.enabled === true
    ? { target: 'ios', bundleIdentifier: config.bundleIdentifier, providers: config.providers }
    : null;
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
