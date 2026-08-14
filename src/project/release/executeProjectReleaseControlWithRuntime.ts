import type { ReleaseControlExecutionResult } from '../../domain/release/ReleaseControlExecutionResult';
import { executeReleaseLifecycleControl } from '../../engine/release/executeReleaseLifecycleControl';
import { executeProjectReleaseControlMutation } from './executeProjectReleaseControlMutation';
import type { ExecuteProjectReleaseControlOptions } from './ExecuteProjectReleaseControlOptions';
import { findProjectReleaseTargetState } from './findProjectReleaseTargetState';
import { inspectProjectReleaseWithRuntime } from './inspectProjectReleaseWithRuntime';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';

export async function executeProjectReleaseControlWithRuntime(
  options: ExecuteProjectReleaseControlOptions,
  runtime: ProjectReleaseRuntime,
): Promise<ReleaseControlExecutionResult> {
  const initial = await inspectProjectReleaseWithRuntime(options, runtime);
  if (!initial.ok) return failed(initial.failure.code);
  const current = findProjectReleaseTargetState(
    initial.inspection.observed,
    options.control.target,
  );
  if (current === null) return blocked('PROJECT_RELEASE_CONTROL_TARGET_NOT_SELECTED');
  const expectedRevision = initial.inspection.desired.revision;
  return executeReleaseLifecycleControl({
    control: options.control,
    inspect: () => inspectTarget(options, expectedRevision, runtime),
    mutate: () =>
      executeProjectReleaseControlMutation({
        control: options.control,
        projectRoot: initial.inspection.projectRoot,
        expectedRevision,
        access: options,
        runtime,
      }),
  });
}

async function inspectTarget(
  options: ExecuteProjectReleaseControlOptions,
  expectedRevision: string,
  runtime: ProjectReleaseRuntime,
) {
  const inspected = await inspectProjectReleaseWithRuntime(options, runtime);
  if (!inspected.ok || inspected.inspection.desired.revision !== expectedRevision) return null;
  return findProjectReleaseTargetState(inspected.inspection.observed, options.control.target);
}

function blocked(code: string): ReleaseControlExecutionResult {
  return { status: 'blocked', mutationAttempted: false, code };
}

function failed(code: string): ReleaseControlExecutionResult {
  return { status: 'failed', mutationAttempted: false, code };
}
