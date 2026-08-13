import { defaultProjectMonetizationRuntime } from './defaultProjectMonetizationRuntime';
import type { ExecuteProjectMonetizationSyncOptions } from './ExecuteProjectMonetizationSyncOptions';
import { executeProjectMonetizationSyncWithRuntime } from './executeProjectMonetizationSyncWithRuntime';
import type { ProjectMonetizationExecutionResult } from './ProjectMonetizationExecutionResult';

export function executeProjectMonetizationSync(
  options: ExecuteProjectMonetizationSyncOptions,
): Promise<ProjectMonetizationExecutionResult> {
  return executeProjectMonetizationSyncWithRuntime(options, defaultProjectMonetizationRuntime);
}
