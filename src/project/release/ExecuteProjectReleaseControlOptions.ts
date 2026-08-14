import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';

export interface ExecuteProjectReleaseControlOptions extends ProjectReleaseAccess {
  readonly projectRoot: string;
  readonly control: ReleaseLifecycleControl;
}
