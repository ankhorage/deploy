import type {
  AppDeployAndroidTargetConfig,
  AppDeployIosTargetConfig,
  AppDeployManifest,
  AppDeployProviderSelection,
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
  if (config?.enabled !== true) return null;
  return { target: 'web', ...optionalProviders(config.providers) };
}

function desiredAndroidTarget(
  config: AppDeployAndroidTargetConfig | undefined,
): DeploymentObservedTarget | null {
  if (config?.enabled !== true) return null;
  return {
    target: 'android',
    package: config.package,
    ...optionalProviders(config.providers),
  };
}

function desiredIosTarget(
  config: AppDeployIosTargetConfig | undefined,
): DeploymentObservedTarget | null {
  if (config?.enabled !== true) return null;
  return {
    target: 'ios',
    bundleIdentifier: config.bundleIdentifier,
    ...optionalProviders(config.providers),
  };
}

function optionalProviders(
  providers: AppDeployProviderSelection | undefined,
): { readonly providers?: AppDeployProviderSelection } {
  return providers === undefined ? {} : { providers };
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
