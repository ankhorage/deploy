import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { executeDeploymentPlan } from '../../engine/executeDeploymentPlan';
import { areDeploymentPlansEqual } from '../areDeploymentPlansEqual';
import { projectSetupBlockingOutcome } from '../setupBlockingOutcome';
import { createProjectIosDeploymentPlan } from './createProjectIosDeploymentPlan';
import { executeProjectIosStep } from './executeProjectIosStep';
import { inspectProjectIosAppStoreConnect } from './inspectProjectIosAppStoreConnect';
import { inspectProjectIosEasSetup } from './inspectProjectIosEasSetup';
import type { ProjectIosDeploymentAccess } from './ProjectIosDeploymentAccess';
import type { ProjectIosDeploymentExecution } from './ProjectIosDeploymentExecution';
import type { ProjectIosDeploymentInspection } from './ProjectIosDeploymentInspection';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import { projectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import type { ProjectIosExecutionState } from './ProjectIosExecutionState';
import { recordProjectIosDeployment } from './recordProjectIosDeployment';
import { resolveProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';

export interface ExecuteProjectIosDeploymentOptions extends ProjectIosDeploymentAccess {
  readonly inspection: ProjectIosDeploymentInspection;
  readonly plan: DeploymentPlan;
}

export function executeProjectIosDeployment(
  options: ExecuteProjectIosDeploymentOptions,
): Promise<ProjectIosDeploymentExecution> {
  return executeProjectIosDeploymentWithRuntime(options, projectIosDeploymentRuntime);
}

export async function executeProjectIosDeploymentWithRuntime(
  options: ExecuteProjectIosDeploymentOptions,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentExecution> {
  const expected = createProjectIosDeploymentPlan(options.inspection);
  if (!areDeploymentPlansEqual(expected, options.plan)) {
    return fromPreflight(failedOutcome('IOS_PLAN_MISMATCH', 'iOS deployment plan is invalid.'));
  }
  if (options.plan.steps.length === 0) return executeNoChange(options.plan);
  if (options.plan.steps[0]?.id === 'ios:remove') return executeRemove(options, runtime);
  const bundleIdentifier = desiredBundleIdentifier(options.inspection);
  if (bundleIdentifier === null) {
    return fromPreflight(failedOutcome('IOS_BUNDLE_IDENTIFIER_MISSING', 'iOS bundle identifier is missing.'));
  }
  const access = resolveProjectIosDeploymentAccess(options);
  const blocker = await inspectExecutionSetup(options.inspection, bundleIdentifier, access, runtime);
  if (blocker !== null) return fromPreflight(blocker);
  return executeMutablePlan(options, bundleIdentifier, access, runtime);
}

async function inspectExecutionSetup(
  inspection: ProjectIosDeploymentInspection,
  bundleIdentifier: string,
  access: ReturnType<typeof resolveProjectIosDeploymentAccess>,
  runtime: ProjectIosDeploymentRuntime,
): Promise<DeploymentStepOutcome | null> {
  const [eas, appStore] = await Promise.all([
    inspectProjectIosEasSetup(inspection.projectRoot, access, runtime),
    inspectProjectIosAppStoreConnect({
      bundleIdentifier,
      version: inspection.intent.version,
      access,
      runtime,
    }),
  ]);
  return easBlocker(eas) ?? appStoreBlocker(appStore.setup);
}

function easBlocker(result: Parameters<typeof projectSetupBlockingOutcome>[0]) {
  return projectSetupBlockingOutcome(result, {
    target: 'ios',
    capability: 'build',
    incompleteCode: 'IOS_BUILD_SETUP_INCOMPLETE',
    incompleteMessage: 'iOS build setup requires provisioning before deployment.',
    unavailableCode: 'IOS_BUILD_UNAVAILABLE',
    unavailableMessage: 'The iOS build capability is not available.',
  });
}

function appStoreBlocker(result: Parameters<typeof projectSetupBlockingOutcome>[0]) {
  return projectSetupBlockingOutcome(result, {
    target: 'ios',
    capability: 'publish',
    incompleteCode: 'IOS_PUBLISH_SETUP_INCOMPLETE',
    incompleteMessage: 'iOS publishing setup requires provisioning before deployment.',
    unavailableCode: 'IOS_PUBLISH_UNAVAILABLE',
    unavailableMessage: 'The iOS publish capability is not available.',
  });
}

async function executeMutablePlan(
  options: ExecuteProjectIosDeploymentOptions,
  bundleIdentifier: string,
  access: ReturnType<typeof resolveProjectIosDeploymentAccess>,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentExecution> {
  const state = createExecutionState();
  const execution = await executeDeploymentPlan({
    plan: options.plan,
    executeStep: (step) =>
      executeProjectIosStep({
        step,
        inspection: options.inspection,
        bundleIdentifier,
        access,
        runtime,
        state,
      }),
  });
  return finalizeExecution(options, execution, state, runtime);
}

async function finalizeExecution(
  options: ExecuteProjectIosDeploymentOptions,
  execution: DeploymentExecutionResult,
  state: ProjectIosExecutionState,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentExecution> {
  if (execution.status !== 'completed' || state.publication === null || state.verification?.ok !== true) {
    return result(execution, state, false);
  }
  const history = await recordProjectIosDeployment({
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

async function executeNoChange(plan: DeploymentPlan): Promise<ProjectIosDeploymentExecution> {
  const execution = await executeDeploymentPlan({
    plan,
    executeStep: () => Promise.resolve({ status: 'completed' }),
  });
  return { execution, publication: null, verification: null, historyRecorded: false };
}

async function executeRemove(
  options: ExecuteProjectIosDeploymentOptions,
  runtime: ProjectIosDeploymentRuntime,
): Promise<ProjectIosDeploymentExecution> {
  const state = createExecutionState();
  const access = resolveProjectIosDeploymentAccess(options);
  const execution = await executeDeploymentPlan({
    plan: options.plan,
    executeStep: (step) =>
      executeProjectIosStep({
        step,
        inspection: options.inspection,
        bundleIdentifier: currentBundleIdentifier(options.inspection) ?? '',
        access,
        runtime,
        state,
      }),
  });
  return result(execution, state, false);
}

function createExecutionState(): ProjectIosExecutionState {
  return {
    fingerprint: null,
    build: null,
    appStorePublication: null,
    publication: null,
    verification: null,
  };
}

function fromPreflight(outcome: DeploymentStepOutcome): ProjectIosDeploymentExecution {
  const execution: DeploymentExecutionResult =
    outcome.status === 'action-required'
      ? { status: 'action-required', action: outcome.action, records: [] }
      : {
          status: 'failed',
          failure:
            outcome.status === 'failed'
              ? outcome.error
              : { code: 'IOS_PREFLIGHT_FAILED', message: 'iOS deployment preflight failed.' },
          records: [],
        };
  return { execution, publication: null, verification: null, historyRecorded: false };
}

function result(
  execution: DeploymentExecutionResult,
  state: ProjectIosExecutionState,
  historyRecorded: boolean,
): ProjectIosDeploymentExecution {
  return {
    execution,
    publication: state.publication,
    verification: state.verification,
    historyRecorded,
  };
}

function desiredBundleIdentifier(inspection: ProjectIosDeploymentInspection): string | null {
  const ios = inspection.desired.targets.ios;
  return ios?.enabled === true ? ios.bundleIdentifier : null;
}

function currentBundleIdentifier(inspection: ProjectIosDeploymentInspection): string | null {
  return inspection.current.targets.ios?.bundleIdentifier ?? null;
}

function failedOutcome(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'ios' } };
}
