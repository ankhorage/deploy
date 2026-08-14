import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

export interface ProjectReleasePublishTargetOptions {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
  readonly targets: ProjectReleaseTargets;
  readonly access: ResolvedProjectReleaseAccess;
}
