import type { ReleaseLifecycleControl } from './ReleaseLifecycleControl';
import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';

export function listReleaseLifecycleControls(
  observed: ReleaseObservedTargetState,
): readonly ReleaseLifecycleControl[] {
  if (observed.target === 'android') return androidControls(observed.rolloutStatus);
  if (observed.target === 'ios') return iosControls(observed);
  return [];
}

function androidControls(
  status: Extract<ReleaseObservedTargetState, { target: 'android' }>['rolloutStatus'],
): readonly ReleaseLifecycleControl[] {
  if (status === 'inProgress') return [{ target: 'android', action: 'halt' }];
  if (status === 'halted') return [{ target: 'android', action: 'resume' }];
  return [];
}

function iosControls(
  observed: Extract<ReleaseObservedTargetState, { target: 'ios' }>,
): readonly ReleaseLifecycleControl[] {
  const controls: ReleaseLifecycleControl[] = [];
  if (observed.phasedReleaseState === 'ACTIVE') {
    controls.push({ target: 'ios', action: 'pause-phased' });
  }
  if (observed.phasedReleaseState === 'PAUSED') {
    controls.push({ target: 'ios', action: 'resume-phased' });
  }
  if (observed.phasedReleaseState === 'INACTIVE') {
    controls.push({ target: 'ios', action: 'cancel-phased' });
  }
  if (observed.reviewState === 'IN_REVIEW') {
    controls.push({ target: 'ios', action: 'cancel-review' });
  }
  return controls;
}
