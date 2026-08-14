import { createReleaseCurrentRevision } from '../../domain/release/createReleaseCurrentRevision';
import { createReleasePlan } from '../../domain/release/createReleasePlan';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import type { ReleasePlan } from '../../domain/release/ReleasePlan';
import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from './ReleaseMutationResult';
import type { ReleaseReconcileResult } from './ReleaseReconcileResult';

const MAX_MUTATIONS = 32;

type InspectRelease = () => Promise<ReleaseObservedState | null>;
type MutateRelease = (
  step: ReleasePlanStep,
  current: ReleaseObservedState,
) => Promise<ReleaseMutationResult>;

export async function executeReleasePlan(options: {
  readonly desired: ReleaseDesiredState;
  readonly plan: ReleasePlan;
  readonly inspect: InspectRelease;
  readonly mutate: MutateRelease;
}): Promise<ReleaseReconcileResult> {
  let expectedRevision = options.plan.currentRevision;
  const executed: string[] = [];
  for (let index = 0; index < MAX_MUTATIONS; index += 1) {
    const current = await options.inspect();
    if (current === null) {
      return failed(options.plan, expectedRevision, executed, 'RELEASE_INSPECTION_FAILED');
    }
    const revision = createReleaseCurrentRevision(current, options.desired.targets);
    if (revision !== expectedRevision) return drifted(options, revision, executed, current);
    const plan = createReleasePlan(options.desired, current);
    const terminal = terminalResult(plan, revision, executed);
    if (terminal !== null) return terminal;
    const step = firstMutationStep(plan.steps);
    if (step === null) return failed(plan, revision, executed, 'RELEASE_EXECUTABLE_STEP_REQUIRED');
    const mutation = await options.mutate(step, current);
    const mutationFailure = mutationResult(plan, revision, executed, mutation);
    if (mutationFailure !== null) return mutationFailure;
    const readback = await verifyReadback(options, step, revision, executed);
    if (readback.result !== null) return readback.result;
    expectedRevision = readback.revision;
    executed.push(step.id);
  }
  const current = await options.inspect();
  const plan = current === null ? options.plan : createReleasePlan(options.desired, current);
  return failed(plan, expectedRevision, executed, 'RELEASE_MUTATION_LIMIT_EXCEEDED');
}

function terminalResult(
  plan: ReleasePlan,
  revision: string,
  executed: readonly string[],
): ReleaseReconcileResult | null {
  if (plan.status === 'no-change') return result('completed', plan, revision, executed);
  if (plan.status === 'waiting') return result('waiting', plan, revision, executed);
  if (plan.status === 'blocked') return result('blocked', plan, revision, executed);
  return null;
}

function firstMutationStep(steps: readonly ReleasePlanStep[]): ReleasePlanStep | null {
  return steps.find((step) => step.operation !== 'verify' && step.operation !== 'record') ?? null;
}

function mutationResult(
  plan: ReleasePlan,
  revision: string,
  executed: readonly string[],
  mutation: ReleaseMutationResult,
): ReleaseReconcileResult | null {
  if (mutation.status === 'completed') return null;
  return {
    status: mutation.status,
    plan,
    currentRevision: revision,
    executedStepIds: executed,
    code: mutation.code,
  };
}

async function verifyReadback(
  options: Parameters<typeof executeReleasePlan>[0],
  step: ReleasePlanStep,
  previousRevision: string,
  executed: readonly string[],
): Promise<{ readonly revision: string; readonly result: ReleaseReconcileResult | null }> {
  const current = await options.inspect();
  if (current === null) {
    return {
      revision: previousRevision,
      result: failed(options.plan, previousRevision, executed, 'RELEASE_READBACK_FAILED'),
    };
  }
  const revision = createReleaseCurrentRevision(current, options.desired.targets);
  const plan = createReleasePlan(options.desired, current);
  if (containsMutationStep(plan, step.id)) {
    return {
      revision,
      result: failed(plan, revision, executed, 'RELEASE_READBACK_VERIFICATION_FAILED'),
    };
  }
  return { revision, result: null };
}

function containsMutationStep(plan: ReleasePlan, stepId: string): boolean {
  return plan.steps.some(
    (step) => step.id === stepId && step.operation !== 'verify' && step.operation !== 'record',
  );
}

function drifted(
  options: Parameters<typeof executeReleasePlan>[0],
  revision: string,
  executed: readonly string[],
  current: ReleaseObservedState,
): ReleaseReconcileResult {
  return {
    status: 'drifted',
    plan: createReleasePlan(options.desired, current),
    currentRevision: revision,
    executedStepIds: executed,
    code: 'RELEASE_STATE_DRIFTED',
  };
}

function failed(
  plan: ReleasePlan,
  revision: string,
  executed: readonly string[],
  code: string,
): ReleaseReconcileResult {
  return { status: 'failed', plan, currentRevision: revision, executedStepIds: executed, code };
}

function result(
  status: 'completed' | 'waiting' | 'blocked',
  plan: ReleasePlan,
  revision: string,
  executed: readonly string[],
): ReleaseReconcileResult {
  return { status, plan, currentRevision: revision, executedStepIds: executed };
}
