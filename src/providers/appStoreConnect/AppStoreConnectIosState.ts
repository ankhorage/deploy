export interface AppStoreConnectIosBuildState {
  readonly buildId: string;
  readonly buildNumber: string;
  readonly processingState?: string;
}

export interface AppStoreConnectIosVersionState {
  readonly versionId: string;
  readonly version: string;
  readonly build: AppStoreConnectIosBuildState | null;
}

export interface AppStoreConnectIosState {
  readonly appId: string;
  readonly bundleIdentifier: string;
  readonly version: AppStoreConnectIosVersionState | null;
}
