import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';

export interface DeploymentObservedRevision {
  readonly revision?: string;
}

export interface DeploymentObservedWebTarget extends DeploymentObservedRevision {
  readonly providers?: AppDeployProviderSelection;
}

export interface DeploymentObservedAndroidTarget extends DeploymentObservedRevision {
  readonly package: string;
  readonly providers?: AppDeployProviderSelection;
}

export interface DeploymentObservedIosTarget extends DeploymentObservedRevision {
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
