import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationPlan } from '../../domain/monetization/MonetizationPlan';
import type { MonetizationPlanStep } from '../../domain/monetization/MonetizationPlanStep';
import { trackAppStoreConnectRequests } from './AppStoreConnectRequestTracker';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreMonetizationExecutionResult } from './AppStoreMonetizationExecutionResult';
import type { AppStoreMonetizationSnapshot } from './AppStoreMonetizationSnapshot';
import { normalizeAppStoreMonetization } from './normalizeAppStoreMonetization';
import { readAppStoreMonetizationSnapshot } from './readAppStoreMonetizationSnapshot';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { writeAppStoreMonetizationProduct } from './writeAppStoreMonetizationProduct';

export async function executeAppStoreMonetizationPlan(options: {
  readonly bundleIdentifier: string;
  readonly desired: MonetizationDesiredState;
  readonly plan: MonetizationPlan;
  readonly expectedRevision: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStoreMonetizationExecutionResult> {
  if (options.plan.status === 'blocked') return failed('APP_STORE_MONETIZATION_PLAN_BLOCKED');
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackAppStoreConnectRequests(options.request);
  const snapshot = await readSnapshot(options, access.token, tracker.request);
  if (snapshot === 'app-required') return appRequired();
  if (snapshot === null) return providerFailure(tracker.blockingStatus());
  const state = normalizeAppStoreMonetization(options.desired, snapshot);
  const revision = createMonetizationCurrentRevision([state]);
  if (revision !== options.expectedRevision) return failed('APP_STORE_MONETIZATION_DRIFT');
  if (!(await executeSteps(options, snapshot, access.token, tracker.request))) {
    return providerFailure(tracker.blockingStatus());
  }
  return verify(options, access.token, tracker.request);
}

async function readSnapshot(
  options: Parameters<typeof executeAppStoreMonetizationPlan>[0],
  token: string,
  request: AppStoreConnectTransport,
): ReturnType<typeof readAppStoreMonetizationSnapshot> {
  return readAppStoreMonetizationSnapshot({
    bundleIdentifier: options.bundleIdentifier,
    desired: options.desired,
    token,
    request,
    now: options.now,
  });
}

async function executeSteps(
  options: Parameters<typeof executeAppStoreMonetizationPlan>[0],
  snapshot: AppStoreMonetizationSnapshot,
  token: string,
  request: AppStoreConnectTransport,
): Promise<boolean> {
  const groups = groupIosSteps(options.plan.steps);
  for (const [productId, steps] of groups) {
    const product = options.desired.products.find((item) => item.id === productId);
    if (product === undefined) return false;
    if (
      !(await writeAppStoreMonetizationProduct({
        snapshot,
        product,
        operations: steps.map((step) => step.operation),
        token,
        request,
        now: options.now,
      }))
    ) {
      return false;
    }
  }
  return true;
}

function groupIosSteps(
  steps: readonly MonetizationPlanStep[],
): ReadonlyMap<string, readonly MonetizationPlanStep[]> {
  const groups = new Map<string, MonetizationPlanStep[]>();
  for (const step of steps) {
    if (step.target !== 'ios') continue;
    const current = groups.get(step.productId) ?? [];
    current.push(step);
    groups.set(step.productId, current);
  }
  return groups;
}

async function verify(
  options: Parameters<typeof executeAppStoreMonetizationPlan>[0],
  token: string,
  request: AppStoreConnectTransport,
): Promise<AppStoreMonetizationExecutionResult> {
  const snapshot = await readSnapshot(options, token, request);
  if (snapshot === 'app-required') return appRequired();
  if (snapshot === null) return failed('APP_STORE_MONETIZATION_VERIFICATION_FAILED');
  const state = normalizeAppStoreMonetization(options.desired, snapshot);
  const plan = createMonetizationPlan({
    desired: options.desired,
    currentRevision: createMonetizationCurrentRevision([state]),
    states: [state],
  });
  return plan.status === 'no-change'
    ? { status: 'completed', state }
    : failed('APP_STORE_MONETIZATION_VERIFICATION_FAILED');
}

function providerFailure(status: 401 | 403 | null): AppStoreMonetizationExecutionResult {
  if (status === 401) return action('authentication', 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED');
  if (status === 403) return action('manual-action', 'APP_STORE_MONETIZATION_PERMISSION_REQUIRED');
  return failed('APP_STORE_MONETIZATION_SYNC_FAILED');
}

function appRequired(): AppStoreMonetizationExecutionResult {
  return action('manual-action', 'APP_STORE_APP_REQUIRED');
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): AppStoreMonetizationExecutionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'app-store-connect',
      target: 'ios',
      code,
      message: 'App Store monetization requires provider action.',
    },
  };
}

function failed(code: string): AppStoreMonetizationExecutionResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'App Store monetization synchronization failed.',
      target: 'ios',
      provider: 'app-store-connect',
    },
  };
}
