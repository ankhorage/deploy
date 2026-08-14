import type { ReleaseLifecycleControl } from './ReleaseLifecycleControl';
import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';

export function isReleaseLifecycleControlSatisfied(
  control: ReleaseLifecycleControl,
  observed: ReleaseObservedTargetState,
): boolean {
  if (control.target !== observed.target) return false;
  if (observed.target === 'android') return androidSatisfied(control, observed.rolloutStatus);
  return iosSatisfied(control, observed);
}

function androidSatisfied(
  control: ReleaseLifecycleControl,
  status: Extract<ReleaseObservedTargetState, { target: 'android' }>['rolloutStatus'],
): boolean {
  if (control.target !== 'android') return false;
  return control.action === 'halt' ? status === 'halted' : status === 'inProgress';
}

function iosSatisfied(
  control: ReleaseLifecycleControl,
  observed: Extract<ReleaseObservedTargetState, { target: 'ios' }>,
): boolean {
  if (control.target !== 'ios') return false;
  if (control.action === 'pause-phased') return observed.phasedReleaseState === 'PAUSED';
  if (control.action === 'resume-phased') return observed.phasedReleaseState === 'ACTIVE';
  if (control.action === 'cancel-phased') return observed.phasedReleaseState === null;
  return observed.reviewState === 'CANCELING';
}
