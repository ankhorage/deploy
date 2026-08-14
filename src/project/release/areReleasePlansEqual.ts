import type { ReleasePlan } from '../../domain/release/ReleasePlan';

export function areReleasePlansEqual(left: ReleasePlan, right: ReleasePlan): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
