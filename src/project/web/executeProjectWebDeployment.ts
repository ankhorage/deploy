import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import type { WebDeploymentPublishIntent } from '../../domain/WebDeploymentPublishIntent';
import { executeDeploymentPlan } from '../../engine/executeDeploymentPlan';
import { cleanupWebArtifact } from '../../targets/web/prepareWebArtifact';
import { areDeploymentPlansEqual } from './areDeploymentPlansEqual';
import { createProjectWebDeploymentPlan } from './createProjectWebDeploymentPlan';
import { executeProjectWebStep } from './executeProjectWebStep';
import { inspectProjectWebSetup } from './inspectProjectWebSetup';
import type { ProjectWebDeploymentAccess } from './ProjectWebDeploymentAccess';
import type { ProjectWebDeploymentExecution } from './ProjectWebDeploymentExecution';
import type { ProjectWebDeploymentInspection } from './ProjectWebDeploymentInspection';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import { projectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import type { ProjectWebExecutionState } from './ProjectWebExecutionState';
import { recordProjectWebDeployment } from './recordProjectWebDeployment';
import { resolveProjectWebDeploymentAccess } from './resolveProjectWebDeploymentAccess';
import { setupBlockingOutcome } from './setupBlockingOutcome';

export interface ExecuteProjectWebDeploymentOptions extends ProjectWebDeploymentAccess {
  readonly inspection: ProjectWebDeploymentInspection;
  readonly plan: DeploymentPlan;
  readonly intent?: WebDeploymentPublishIntent;
}

export function executeProjectWebDeployment(
  options: ExecuteProjectWebDeploymentOptions,
): Promise<ProjectWebDeploymentExecution> {
  return executeProjectWebDeploymentWithRuntime(options, projectWebDeploymentRuntime);
}

export async function executeProjectWebDeploymentWithRuntime(
  options: ExecuteProjectWebDeploymentOptions,
  runtime: ProjectWebDeploymentRuntime,
): Promise<ProjectWebDeploymentExecution> {
  const expected = createProjectWebDeploymentPlan(options.inspection);
  if (!areDeploymentPlansEqual(expected, options.plan)) {
    return fromPreflight(failedOutcome('WEB_PLAN_MISMATCH', 'Web deployment plan is invalid.'));
  }
  if (options.plan.steps.length === 0) return executeNoChange(options.plan);
  if (options.plan.steps[0]?.id === 'web:remove') return executeRemove(options, runtime);

  const access = resolveProjectWebDeploymentAccess(options);
  const setup = await inspectProjectWebSetup(options.inspection.projectRoot, access, runtime);
  const blocker = setupBlockingOutcome(setup);
  if (blocker !== null) return fromPreflight(blocker);

  return executeMutableWebPlan(options, access, runtime);
}

async function executeMutableWebPlan(
  options: ExecuteProjectWebDeploymentOptions,
  access: ReturnType<typeof resolveProjectWebDeploymentAccess>,
  runtime: ProjectWebDeploymentRuntime,
): Promise<ProjectWebDeploymentExecution> {
  const state: ProjectWebExecutionState = { artifact: null, publication: null, verification: null };
  let execution: DeploymentExecutionResult;
  try {
    execution = await executeDeploymentPlan({
      plan: options.plan,
      executeStep: (step) =>
        executeProjectWebStep({
          step,
          projectRoot: options.inspection.projectRoot,
          ...(options.inspection.desiredRevision === undefined
            ? {}
            : { expectedRevision: options.inspection.desiredRevision }),
          intent: options.intent ?? { mode: 'preview' },
          access,
          runtime,
          state,
        }),
    });
  } finally {
    if (state.artifact !== null) await cleanupWebArtifact(state.artifact.directory);
  }
  return finalizeExecution(options, execution, state, runtime);
}

async function finalizeExecution(
  options: ExecuteProjectWebDeploymentOptions,
  execution: DeploymentExecutionResult,
  state: ProjectWebExecutionState,
  runtime: ProjectWebDeploymentRuntime,
): Promise<ProjectWebDeploymentExecution> {
  if (
    execution.status !== 'completed' ||
    state.publication === null ||
    state.verification?.ok !== true
  ) {
    return result(execution, state, false);
  }
  const history = await recordProjectWebDeployment({
    inspection: options.inspection,
    plan: options.plan,
    execution,
    verification: state.verification,
    publication: state.publication,
    recordedAt: runtime.now().toISOString(),
  });
  return history.recorded
    ? result(execution, state, true)
    : { ...result(execution, state, false), historyFailure: history.failure };
}

async function executeNoChange(plan: DeploymentPlan): Promise<ProjectWebDeploymentExecution> {
  const execution = await executeDeploymentPlan({
    plan,
    executeStep: () => Promise.resolve({ status: 'completed' }),
  });
  return { execution, publication: null, verification: null, historyRecorded: false };
}

async function executeRemove(
  options: ExecuteProjectWebDeploymentOptions,
  runtime: ProjectWebDeploymentRuntime,
): Promise<ProjectWebDeploymentExecution> {
  const state: ProjectWebExecutionState = { artifact: null, publication: null, verification: null };
  const access = resolveProjectWebDeploymentAccess(options);
  const execution = await executeDeploymentPlan({
    plan: options.plan,
    executeStep: (step) =>
      executeProjectWebStep({
        step,
        projectRoot: options.inspection.projectRoot,
        intent: options.intent ?? { mode: 'preview' },
        access,
        runtime,
        state,
      }),
  });
  return result(execution, state, false);
}

function fromPreflight(outcome: DeploymentStepOutcome): ProjectWebDeploymentExecution {
  const execution: DeploymentExecutionResult =
    outcome.status === 'action-required'
      ? { status: 'action-required', action: outcome.action, records: [] }
      : {
          status: 'failed',
          failure:
            outcome.status === 'failed'
              ? outcome.error
              : { code: 'WEB_PREFLIGHT_FAILED', message: 'Web deployment preflight failed.' },
          records: [],
        };
  return { execution, publication: null, verification: null, historyRecorded: false };
}

function failedOutcome(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'web' } };
}

function result(
  execution: DeploymentExecutionResult,
  state: ProjectWebExecutionState,
  historyRecorded: boolean,
): ProjectWebDeploymentExecution {
  return {
    execution,
    publication: state.publication,
    verification: state.verification,
    historyRecorded,
  };
}
