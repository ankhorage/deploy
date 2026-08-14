import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import type { ReleaseObservedTargetState } from '../../domain/release/ReleaseObservedTargetState';
import type { ReleaseTarget } from '../../domain/release/ReleaseTarget';

export function findProjectReleaseTargetState(
  observed: ReleaseObservedState,
  target: ReleaseTarget,
): ReleaseObservedTargetState | null {
  const matches = observed.targets.filter((state) => state.target === target);
  return matches.length === 1 ? (matches[0] ?? null) : null;
}
