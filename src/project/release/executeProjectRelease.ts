import { defaultProjectReleaseRuntime } from './defaultProjectReleaseRuntime';
import type { ExecuteProjectReleaseOptions } from './ExecuteProjectReleaseOptions';
import { executeProjectReleaseWithRuntime } from './executeProjectReleaseWithRuntime';
import type { ProjectReleaseExecutionResult } from './ProjectReleaseExecutionResult';

export function executeProjectRelease(
  options: ExecuteProjectReleaseOptions,
): Promise<ProjectReleaseExecutionResult> {
  return executeProjectReleaseWithRuntime(options, defaultProjectReleaseRuntime);
}
