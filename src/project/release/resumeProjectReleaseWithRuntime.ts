import { resumeReleaseExecution } from '../../engine/release/resumeReleaseExecution';
import { readProjectReleaseHistory } from '../releaseHistory/readProjectReleaseHistory';
import { createProjectReleasePlan } from './createProjectReleasePlan';
import { executeProjectReleaseMutation } from './executeProjectReleaseMutation';
import { inspectExpectedProjectReleaseObserved } from './inspectExpectedProjectReleaseObserved';
import { inspectProjectReleaseWithRuntime } from './inspectProjectReleaseWithRuntime';
import type { ProjectReleaseExecutionResult } from './ProjectReleaseExecutionResult';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { recordProjectReleaseExecution } from './recordProjectReleaseExecution';
import type { ResumeProjectReleaseOptions } from './ResumeProjectReleaseOptions';

export async function resumeProjectReleaseWithRuntime(
  options: ResumeProjectReleaseOptions,
  runtime: ProjectReleaseRuntime,
): Promise<ProjectReleaseExecutionResult> {
  try {
    const previous = await readProjectReleaseHistory({
      projectRoot: options.projectRoot,
      executionId: options.previousExecutionId,
    });
    if (previous === null) return missingHistory();
    const inspected = await inspectProjectReleaseWithRuntime(options, runtime);
    if (!inspected.ok) return inspected;
    const plan = createProjectReleasePlan(inspected.inspection);
    const result = await resumeReleaseExecution({
      desired: inspected.inspection.desired,
      previous,
      inspect: () =>
        inspectExpectedProjectReleaseObserved({
          projectRoot: inspected.inspection.projectRoot,
          expectedRevision: inspected.inspection.desired.revision,
          access: options,
          runtime,
        }),
      mutate: (step) =>
        executeProjectReleaseMutation({
          step,
          projectRoot: inspected.inspection.projectRoot,
          expectedRevision: inspected.inspection.desired.revision,
          access: options,
          runtime,
        }),
    });
    const execution = await recordProjectReleaseExecution({
      projectRoot: inspected.inspection.projectRoot,
      executionId: options.executionId,
      recordedAt: runtime.now().toISOString(),
      desired: inspected.inspection.desired,
      initialPlan: plan,
      result,
    });
    return { ok: true, execution };
  } catch {
    return failed();
  }
}

function missingHistory(): ProjectReleaseExecutionResult {
  return {
    ok: false,
    failure: {
      code: 'PROJECT_RELEASE_RESUME_HISTORY_REQUIRED',
      message: 'Previous release execution history is required for resume.',
    },
  };
}

function failed(): ProjectReleaseExecutionResult {
  return {
    ok: false,
    failure: {
      code: 'PROJECT_RELEASE_RESUME_FAILED',
      message: 'Project release resume failed.',
    },
  };
}
