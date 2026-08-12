export interface EasIosBuildArtifact {
  readonly buildId: string;
  readonly buildProfile: string;
  readonly fingerprint: string;
  readonly version: string;
  readonly buildNumber: string;
  readonly archiveUrl: string;
}
