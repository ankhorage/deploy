import type { ProjectReleaseAccess } from './ProjectReleaseAccess';

export interface InspectProjectReleaseOptions extends ProjectReleaseAccess {
  readonly projectRoot: string;
}
