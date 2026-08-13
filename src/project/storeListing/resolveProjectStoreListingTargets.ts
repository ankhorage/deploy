import type { ProjectStoreListingTargetIdentity } from './ProjectStoreListingTargetIdentity';

interface DeployTargets {
  readonly android?: {
    readonly enabled: boolean;
    readonly package: string;
    readonly providers?: { readonly publish?: string };
  };
  readonly ios?: {
    readonly enabled: boolean;
    readonly bundleIdentifier: string;
    readonly providers?: { readonly publish?: string };
  };
}

export function resolveProjectStoreListingTargets(
  targets: DeployTargets,
): ProjectStoreListingTargetIdentity | null {
  const { android } = targets;
  const { ios } = targets;
  if (android?.enabled === true && !supported(android.providers?.publish, 'google-play'))
    return null;
  if (ios?.enabled === true && !supported(ios.providers?.publish, 'app-store-connect')) return null;
  return {
    ...(android?.enabled === true ? { androidPackageName: android.package } : {}),
    ...(ios?.enabled === true ? { iosBundleIdentifier: ios.bundleIdentifier } : {}),
  };
}

function supported(value: string | undefined, expected: string): boolean {
  return value === undefined || value === expected;
}
