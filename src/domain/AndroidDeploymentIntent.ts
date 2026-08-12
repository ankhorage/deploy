export const ANDROID_DEPLOYMENT_TRACKS = ['internal', 'alpha', 'beta', 'production'] as const;
export type AndroidDeploymentTrack = (typeof ANDROID_DEPLOYMENT_TRACKS)[number];

export const ANDROID_RELEASE_STATUSES = ['draft', 'completed'] as const;
export type AndroidReleaseStatus = (typeof ANDROID_RELEASE_STATUSES)[number];

export interface AndroidDeploymentIntent {
  readonly buildProfile: string;
  readonly track: AndroidDeploymentTrack;
  readonly releaseStatus: AndroidReleaseStatus;
}
