import { isReleaseLifecycleControlReadbackSatisfied } from '../../domain/release/isReleaseLifecycleControlReadbackSatisfied';
import { isReleaseLifecycleControlSatisfied } from '../../domain/release/isReleaseLifecycleControlSatisfied';
import { listReleaseLifecycleControls } from '../../domain/release/listReleaseLifecycleControls';
import type { ReleaseControlExecutionResult } from '../../domain/release/ReleaseControlExecutionResult';
import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ReleaseObservedTargetState } from '../../domain/release/ReleaseObservedTargetState';
import type { ReleaseMutationResult } from './ReleaseMutationResult';

type InspectTarget = () => Promise<ReleaseObservedTargetState | null>;
type MutateControl = (
  control: ReleaseLifecycleControl,
  current: ReleaseObservedTargetState,
) => Promise<ReleaseMutationResult>;

type FailedReleaseMutation = Exclude<ReleaseMutationResult, { readonly status: 'completed' }>;

export async function executeReleaseLifecycleControl(options: {
  readonly control: ReleaseLifecycleControl;
  readonly inspect: InspectTarget;
  readonly mutate: MutateControl;
}): Promise<ReleaseControlExecutionResult> {
  const before = await options.inspect();
  if (before === null) return failed(false, 'RELEASE_CONTROL_INSPECTION_FAILED');
  if (before.target !== options.control.target) return blocked('RELEASE_CONTROL_TARGET_MISMATCH');
  if (isReleaseLifecycleControlSatisfied(options.control, before)) {
    return { status: 'completed', mutationAttempted: false };
  }
  if (!isAvailable(options.control, before)) return blocked('RELEASE_CONTROL_UNAVAILABLE');
  const mutation = await options.mutate(options.control, before);
  if (mutation.status !== 'completed') return mutationFailure(mutation);
  return verifyReadback(options);
}

async function verifyReadback(
  options: Parameters<typeof executeReleaseLifecycleControl>[0],
): Promise<ReleaseControlExecutionResult> {
  const after = await options.inspect();
  if (after === null) return failed(true, 'RELEASE_CONTROL_READBACK_FAILED');
  if (!isReleaseLifecycleControlReadbackSatisfied(options.control, after)) {
    return failed(true, 'RELEASE_CONTROL_READBACK_VERIFICATION_FAILED');
  }
  return { status: 'completed', mutationAttempted: true };
}

function isAvailable(
  control: ReleaseLifecycleControl,
  observed: ReleaseObservedTargetState,
): boolean {
  return listReleaseLifecycleControls(observed).some(
    (candidate) => candidate.target === control.target && candidate.action === control.action,
  );
}

function mutationFailure(mutation: FailedReleaseMutation): ReleaseControlExecutionResult {
  if (mutation.status === 'blocked') return blocked(mutation.code);
  return failed(true, mutation.code);
}

function blocked(code: string): ReleaseControlExecutionResult {
  return { status: 'blocked', mutationAttempted: false, code };
}

function failed(mutationAttempted: boolean, code: string): ReleaseControlExecutionResult {
  return { status: 'failed', mutationAttempted, code };
}
