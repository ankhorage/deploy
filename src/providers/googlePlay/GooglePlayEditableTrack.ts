import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { GooglePlayEditableRelease } from './GooglePlayEditableRelease';

export interface GooglePlayEditableTrack {
  readonly track: AndroidDeploymentTrack;
  readonly releases: readonly GooglePlayEditableRelease[];
}
