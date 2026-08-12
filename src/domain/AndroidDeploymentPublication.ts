import type {
  AndroidDeploymentTrack,
  AndroidReleaseStatus,
} from './AndroidDeploymentIntent';

export interface AndroidDeploymentPublication {
  readonly target: 'android';
  readonly revision: string;
  readonly buildProvider: 'eas';
  readonly publishProvider: 'google-play';
  readonly buildId: string;
  readonly versionCode: number;
  readonly track: AndroidDeploymentTrack;
  readonly releaseStatus: AndroidReleaseStatus;
}
