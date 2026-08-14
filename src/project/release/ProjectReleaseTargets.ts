import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ProjectReleaseWebContext } from './ProjectReleaseWebContext';

export interface ProjectReleaseTargets {
  readonly web?: ProjectReleaseWebContext;
  readonly android?: {
    readonly packageName: string;
    readonly track: AndroidDeploymentTrack;
    readonly buildProfile?: string;
  };
  readonly ios?: {
    readonly bundleIdentifier: string;
    readonly buildProfile?: string;
  };
}
