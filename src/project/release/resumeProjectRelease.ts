import { defaultProjectReleaseRuntime } from './defaultProjectReleaseRuntime';
import type { ProjectReleaseExecutionResult } from './ProjectReleaseExecutionResult';
import type { ResumeProjectReleaseOptions } from './ResumeProjectReleaseOptions';
import { resumeProjectReleaseWithRuntime } from './resumeProjectReleaseWithRuntime';

export function resumeProjectRelease(
  options: ResumeProjectReleaseOptions,
): Promise<ProjectReleaseExecutionResult> {
  return resumeProjectReleaseWithRuntime(options, defaultProjectReleaseRuntime);
}
