import {
  ANDROID_DEPLOYMENT_TRACKS,
  ANDROID_RELEASE_STATUSES,
  type AndroidDeploymentIntent,
} from '../../domain/AndroidDeploymentIntent';

export function isAndroidDeploymentIntentValid(intent: AndroidDeploymentIntent): boolean {
  return (
    intent.buildProfile.trim().length > 0 &&
    ANDROID_DEPLOYMENT_TRACKS.some((track) => track === intent.track) &&
    ANDROID_RELEASE_STATUSES.some((status) => status === intent.releaseStatus)
  );
}
