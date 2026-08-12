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
  revision?: string,
): DeploymentObservedTarget | null {
  switch (target) {
    case 'web':
      return desiredWebTarget(desired.targets.web, revision);
    case 'android':
      return desiredAndroidTarget(desired.targets.android, revision);
    case 'ios':
      return desiredIosTarget(desired.targets.ios, revision);
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

export function areTargetConfigurationsEqual(
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
  revision?: string,
): DeploymentObservedTarget | null {
  if (config?.enabled !== true) return null;
  return { target: 'web', ...optionalProviders(config.providers), ...optionalRevision(revision) };
}

function desiredAndroidTarget(
  config: AppDeployAndroidTargetConfig | undefined,
  revision?: string,
): DeploymentObservedTarget | null {
  if (config?.enabled !== true) return null;
  return {
    target: 'android',
    package: config.package,
    ...optionalProviders(config.providers),
    ...optionalRevision(revision),
  };
}

function desiredIosTarget(
  config: AppDeployIosTargetConfig | undefined,
  revision?: string,
): DeploymentObservedTarget | null {
  if (config?.enabled !== true) return null;
  return {
    target: 'ios',
    bundleIdentifier: config.bundleIdentifier,
    ...optionalProviders(config.providers),
    ...optionalRevision(revision),
  };
}

function optionalProviders(providers: AppDeployProviderSelection | undefined): {
  readonly providers?: AppDeployProviderSelection;
} {
  return providers === undefined ? {} : { providers };
}

function optionalRevision(revision: string | undefined): { readonly revision?: string } {
  return revision === undefined ? {} : { revision };
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
