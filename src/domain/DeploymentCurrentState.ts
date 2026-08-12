import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

export interface DeploymentObservedWebTarget {
  readonly providers?: AppDeployProviderSelection;
}

export interface DeploymentObservedAndroidTarget {
  readonly package: string;
  readonly providers?: AppDeployProviderSelection;
}

export interface DeploymentObservedIosTarget {
  readonly bundleIdentifier: string;
  readonly providers?: AppDeployProviderSelection;
}

export type DeploymentObservedTarget =
  | ({ readonly target: 'web' } & DeploymentObservedWebTarget)
  | ({ readonly target: 'android' } & DeploymentObservedAndroidTarget)
  | ({ readonly target: 'ios' } & DeploymentObservedIosTarget);

export interface DeploymentCurrentState {
  readonly targets: {
    readonly web?: DeploymentObservedWebTarget;
    readonly android?: DeploymentObservedAndroidTarget;
    readonly ios?: DeploymentObservedIosTarget;
  };
}
