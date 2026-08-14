import type { ReleaseControlExecutionResult } from '../../domain/release/ReleaseControlExecutionResult';
import { defaultProjectReleaseRuntime } from './defaultProjectReleaseRuntime';
import type { ExecuteProjectReleaseControlOptions } from './ExecuteProjectReleaseControlOptions';
import { executeProjectReleaseControlWithRuntime } from './executeProjectReleaseControlWithRuntime';

export function executeProjectReleaseControl(
  options: ExecuteProjectReleaseControlOptions,
): Promise<ReleaseControlExecutionResult> {
  return executeProjectReleaseControlWithRuntime(options, defaultProjectReleaseRuntime);
}
