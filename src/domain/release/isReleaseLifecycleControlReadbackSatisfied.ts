import { isReleaseLifecycleControlSatisfied } from './isReleaseLifecycleControlSatisfied';
import type { ReleaseLifecycleControl } from './ReleaseLifecycleControl';
import type { ReleaseObservedTargetState } from './ReleaseObservedTargetState';

export function isReleaseLifecycleControlReadbackSatisfied(
  control: ReleaseLifecycleControl,
  observed: ReleaseObservedTargetState,
): boolean {
  if (isReleaseLifecycleControlSatisfied(control, observed)) return true;
  return (
    control.target === 'ios' &&
    control.action === 'cancel-review' &&
    observed.target === 'ios' &&
    observed.reviewState === 'COMPLETE'
  );
}
