export interface IosDeploymentPublication {
  readonly target: 'ios';
  readonly revision: string;
  readonly buildProvider: 'eas';
  readonly publishProvider: 'app-store-connect';
  readonly buildId: string;
  readonly version: string;
  readonly buildNumber: string;
}
