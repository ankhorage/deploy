import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationPlan } from '../../domain/monetization/MonetizationPlan';
import type { MonetizationPlanStep } from '../../domain/monetization/MonetizationPlanStep';
import type { GooglePlayMonetizationExecutionResult } from './GooglePlayMonetizationResult';
import { trackGooglePlayRequests } from './GooglePlayRequestTracker';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { inspectGooglePlayMonetization } from './inspectGooglePlayMonetization';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';
import { writeGooglePlayMonetizationProduct } from './writeGooglePlayMonetizationProduct';

export async function executeGooglePlayMonetizationPlan(options: {
  readonly packageName: string;
  readonly desired: MonetizationDesiredState;
  readonly plan: MonetizationPlan;
  readonly expectedRevision: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayMonetizationExecutionResult> {
  if (options.plan.status === 'blocked') return failed('GOOGLE_PLAY_MONETIZATION_PLAN_BLOCKED');
  const preflight = await inspectGooglePlayMonetization(options);
  if (preflight.status !== 'completed') return preflight;
  const revision = createMonetizationCurrentRevision([preflight.state]);
  if (revision !== options.expectedRevision) return failed('GOOGLE_PLAY_MONETIZATION_DRIFT');
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackGooglePlayRequests(options.request);
  if (!(await executeSteps(options, access.token, tracker.request))) {
    return providerFailure(tracker.blockingStatus());
  }
  return verify(options);
}

async function executeSteps(
  options: Parameters<typeof executeGooglePlayMonetizationPlan>[0],
  token: string,
  request: GooglePlayTransport,
): Promise<boolean> {
  const groups = groupAndroidSteps(options.plan.steps);
  for (const [productId, steps] of groups) {
    const product = options.desired.products.find((item) => item.id === productId);
    if (product === undefined) return false;
    const ok = await writeGooglePlayMonetizationProduct({
      packageName: options.packageName,
      product,
      operations: steps.map((step) => step.operation),
      token,
      request,
    });
    if (!ok) return false;
  }
  return true;
}

function groupAndroidSteps(
  steps: readonly MonetizationPlanStep[],
): ReadonlyMap<string, readonly MonetizationPlanStep[]> {
  const groups = new Map<string, MonetizationPlanStep[]>();
  for (const step of steps) {
    if (step.target !== 'android') continue;
    const current = groups.get(step.productId) ?? [];
    current.push(step);
    groups.set(step.productId, current);
  }
  return groups;
}

async function verify(
  options: Parameters<typeof executeGooglePlayMonetizationPlan>[0],
): Promise<GooglePlayMonetizationExecutionResult> {
  const inspection = await inspectGooglePlayMonetization(options);
  if (inspection.status !== 'completed') return inspection;
  const plan = createMonetizationPlan({
    desired: options.desired,
    currentRevision: createMonetizationCurrentRevision([inspection.state]),
    states: [inspection.state],
  });
  return plan.status === 'no-change'
    ? { status: 'completed', state: inspection.state }
    : failed('GOOGLE_PLAY_MONETIZATION_VERIFICATION_FAILED');
}

function providerFailure(status: 401 | 403 | null): GooglePlayMonetizationExecutionResult {
  if (status === 401) return action('authentication', 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED');
  if (status === 403)
    return action('manual-action', 'GOOGLE_PLAY_MONETIZATION_PERMISSION_REQUIRED');
  return failed('GOOGLE_PLAY_MONETIZATION_SYNC_FAILED');
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): GooglePlayMonetizationExecutionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'google-play',
      target: 'android',
      code,
      message: 'Google Play monetization access requires provider action.',
    },
  };
}

function failed(code: string): GooglePlayMonetizationExecutionResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'Google Play monetization synchronization failed.',
      target: 'android',
      provider: 'google-play',
    },
  };
}
