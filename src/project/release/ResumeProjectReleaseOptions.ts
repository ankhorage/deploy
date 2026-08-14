import type { ProjectReleaseAccess } from './ProjectReleaseAccess';

export interface ResumeProjectReleaseOptions extends ProjectReleaseAccess {
  readonly projectRoot: string;
  readonly previousExecutionId: string;
  readonly executionId: string;
}
