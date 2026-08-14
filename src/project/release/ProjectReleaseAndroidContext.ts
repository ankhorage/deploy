import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';

export interface ProjectReleaseAndroidContext {
  readonly track: AndroidDeploymentTrack;
  readonly buildProfile?: string;
}
