import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { executeDeploymentPlan } from '../../engine/executeDeploymentPlan';
import { areDeploymentPlansEqual } from '../areDeploymentPlansEqual';
import { projectSetupBlockingOutcome } from '../setupBlockingOutcome';
import { createProjectAndroidDeploymentPlan } from './createProjectAndroidDeploymentPlan';
import { executeProjectAndroidStep } from './executeProjectAndroidStep';
import { inspectProjectAndroidEasSetup } from './inspectProjectAndroidEasSetup';
import { inspectProjectAndroidGooglePlay } from './inspectProjectAndroidGooglePlay';
import type { ProjectAndroidDeploymentAccess } from './ProjectAndroidDeploymentAccess';
import type { ProjectAndroidDeploymentExecution } from './ProjectAndroidDeploymentExecution';
import type { ProjectAndroidDeploymentInspection } from './ProjectAndroidDeploymentInspection';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import { projectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import type { ProjectAndroidExecutionState } from './ProjectAndroidExecutionState';
import { recordProjectAndroidDeployment } from './recordProjectAndroidDeployment';
import { resolveProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';

export interface ExecuteProjectAndroidDeploymentOptions extends ProjectAndroidDeploymentAccess {
  readonly inspection: ProjectAndroidDeploymentInspection;
  readonly plan: DeploymentPlan;
}

export function executeProjectAndroidDeployment(
  options: ExecuteProjectAndroidDeploymentOptions,
): Promise<ProjectAndroidDeploymentExecution> {
  return executeProjectAndroidDeploymentWithRuntime(options, projectAndroidDeploymentRuntime);
}

export async function executeProjectAndroidDeploymentWithRuntime(
  options: ExecuteProjectAndroidDeploymentOptions,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentExecution> {
  const expected = createProjectAndroidDeploymentPlan(options.inspection);
  if (!areDeploymentPlansEqual(expected, options.plan)) {
    return fromPreflight(failedOutcome('ANDROID_PLAN_MISMATCH', 'Android deployment plan is invalid.'));
  }
  if (options.plan.steps.length === 0) return executeNoChange(options.plan);
  if (options.plan.steps[0]?.id === 'android:remove') return executeRemove(options, runtime);
  const packageName = desiredPackage(options.inspection);
  if (packageName === null) {
    return fromPreflight(failedOutcome('ANDROID_PACKAGE_MISSING', 'Android package is missing.'));
  }
  const access = resolveProjectAndroidDeploymentAccess(options);
  const blocker = await inspectExecutionSetup(options.inspection, packageName, access, runtime);
  if (blocker !== null) return fromPreflight(blocker);
  return executeMutablePlan(options, packageName, access, runtime);
}

async function inspectExecutionSetup(
  inspection: ProjectAndroidDeploymentInspection,
  packageName: string,
  access: ReturnType<typeof resolveProjectAndroidDeploymentAccess>,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<DeploymentStepOutcome | null> {
  const [eas, google] = await Promise.all([
    inspectProjectAndroidEasSetup(inspection.projectRoot, access, runtime),
    inspectProjectAndroidGooglePlay({ packageName, track: inspection.intent.track, access, runtime }),
  ]);
  return easBlocker(eas) ?? googleBlocker(google.setup);
}

function easBlocker(result: Parameters<typeof projectSetupBlockingOutcome>[0]) {
  return projectSetupBlockingOutcome(result, {
    target: 'android',
    capability: 'build',
    incompleteCode: 'ANDROID_BUILD_SETUP_INCOMPLETE',
    incompleteMessage: 'Android build setup requires provisioning before deployment.',
    unavailableCode: 'ANDROID_BUILD_UNAVAILABLE',
    unavailableMessage: 'The Android build capability is not available.',
  });
}

function googleBlocker(result: Parameters<typeof projectSetupBlockingOutcome>[0]) {
  return projectSetupBlockingOutcome(result, {
    target: 'android',
    capability: 'publish',
    incompleteCode: 'ANDROID_PUBLISH_SETUP_INCOMPLETE',
    incompleteMessage: 'Android publishing setup requires provisioning before deployment.',
    unavailableCode: 'ANDROID_PUBLISH_UNAVAILABLE',
    unavailableMessage: 'The Android publish capability is not available.',
  });
}

async function executeMutablePlan(
  options: ExecuteProjectAndroidDeploymentOptions,
  packageName: string,
  access: ReturnType<typeof resolveProjectAndroidDeploymentAccess>,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentExecution> {
  const state: ProjectAndroidExecutionState = {
    fingerprint: null,
    build: null,
    publication: null,
    verification: null,
  };
  const execution = await executeDeploymentPlan({
    plan: options.plan,
    executeStep: (step) =>
      executeProjectAndroidStep({
        step,
        inspection: options.inspection,
        packageName,
        access,
        runtime,
        state,
      }),
  });
  return finalizeExecution(options, execution, state, runtime);
}

async function finalizeExecution(
  options: ExecuteProjectAndroidDeploymentOptions,
  execution: DeploymentExecutionResult,
  state: ProjectAndroidExecutionState,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentExecution> {
  if (
    execution.status !== 'completed' ||
    state.publication === null ||
    state.verification?.ok !== true
  ) {
    return result(execution, state, false);
  }
  const history = await recordProjectAndroidDeployment({
    inspection: options.inspection,
    publication: state.publication,
    plan: options.plan,
    execution,
    verification: state.verification,
    recordedAt: runtime.now().toISOString(),
  });
  return history.recorded
    ? result(execution, state, true)
    : { ...result(execution, state, false), historyFailure: history.failure };
}

async function executeNoChange(plan: DeploymentPlan): Promise<ProjectAndroidDeploymentExecution> {
  const execution = await executeDeploymentPlan({
    plan,
    executeStep: () => Promise.resolve({ status: 'completed' }),
  });
  return { execution, publication: null, verification: null, historyRecorded: false };
}

async function executeRemove(
  options: ExecuteProjectAndroidDeploymentOptions,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<ProjectAndroidDeploymentExecution> {
  const state: ProjectAndroidExecutionState = {
    fingerprint: null,
    build: null,
    publication: null,
    verification: null,
  };
  const access = resolveProjectAndroidDeploymentAccess(options);
  const execution = await executeDeploymentPlan({
    plan: options.plan,
    executeStep: (step) =>
      executeProjectAndroidStep({
        step,
        inspection: options.inspection,
        packageName: currentPackage(options.inspection) ?? '',
        access,
        runtime,
        state,
      }),
  });
  return result(execution, state, false);
}

function fromPreflight(outcome: DeploymentStepOutcome): ProjectAndroidDeploymentExecution {
  const execution: DeploymentExecutionResult =
    outcome.status === 'action-required'
      ? { status: 'action-required', action: outcome.action, records: [] }
      : {
          status: 'failed',
          failure:
            outcome.status === 'failed'
              ? outcome.error
              : { code: 'ANDROID_PREFLIGHT_FAILED', message: 'Android deployment preflight failed.' },
          records: [],
        };
  return { execution, publication: null, verification: null, historyRecorded: false };
}

function result(
  execution: DeploymentExecutionResult,
  state: ProjectAndroidExecutionState,
  historyRecorded: boolean,
): ProjectAndroidDeploymentExecution {
  return {
    execution,
    publication: state.publication,
    verification: state.verification,
    historyRecorded,
  };
}

function desiredPackage(inspection: ProjectAndroidDeploymentInspection): string | null {
  const android = inspection.desired.targets.android;
  return android?.enabled === true ? android.package : null;
}

function currentPackage(inspection: ProjectAndroidDeploymentInspection): string | null {
  return inspection.current.targets.android?.package ?? null;
}

function failedOutcome(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'android' } };
}
