import type { ReleaseReconcileResult } from '../../domain/release/ReleaseReconcileResult';
import { executeReleasePlan } from '../../engine/release/executeReleasePlan';
import { areReleasePlansEqual } from './areReleasePlansEqual';
import { createProjectReleasePlan } from './createProjectReleasePlan';
import { executeProjectReleaseMutation } from './executeProjectReleaseMutation';
import type { ExecuteProjectReleaseOptions } from './ExecuteProjectReleaseOptions';
import { inspectExpectedProjectReleaseObserved } from './inspectExpectedProjectReleaseObserved';
import type { ProjectReleaseExecutionResult } from './ProjectReleaseExecutionResult';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { recordProjectReleaseExecution } from './recordProjectReleaseExecution';

export async function executeProjectReleaseWithRuntime(
  options: ExecuteProjectReleaseOptions,
  runtime: ProjectReleaseRuntime,
): Promise<ProjectReleaseExecutionResult> {
  try {
    const expected = createProjectReleasePlan(options.inspection);
    const result = areReleasePlansEqual(expected, options.plan)
      ? await executePlannedRelease(options, runtime)
      : blocked(expected, 'PROJECT_RELEASE_PLAN_MISMATCH');
    const execution = await recordProjectReleaseExecution({
      projectRoot: options.inspection.projectRoot,
      executionId: options.executionId,
      recordedAt: runtime.now().toISOString(),
      desired: options.inspection.desired,
      initialPlan: expected,
      result,
    });
    return { ok: true, execution };
  } catch {
    return failed();
  }
}

function executePlannedRelease(
  options: ExecuteProjectReleaseOptions,
  runtime: ProjectReleaseRuntime,
): Promise<ReleaseReconcileResult> {
  return executeReleasePlan({
    desired: options.inspection.desired,
    plan: options.plan,
    inspect: () =>
      inspectExpectedProjectReleaseObserved({
        projectRoot: options.inspection.projectRoot,
        expectedRevision: options.inspection.desired.revision,
        access: options,
        runtime,
      }),
    mutate: (step) =>
      executeProjectReleaseMutation({
        step,
        projectRoot: options.inspection.projectRoot,
        expectedRevision: options.inspection.desired.revision,
        access: options,
        runtime,
      }),
  });
}

function blocked(
  plan: ReturnType<typeof createProjectReleasePlan>,
  code: string,
): ReleaseReconcileResult {
  return {
    status: 'blocked',
    plan,
    currentRevision: plan.currentRevision,
    executedStepIds: [],
    code,
  };
}

function failed(): ProjectReleaseExecutionResult {
  return {
    ok: false,
    failure: {
      code: 'PROJECT_RELEASE_EXECUTION_FAILED',
      message: 'Project release execution failed.',
    },
  };
}
