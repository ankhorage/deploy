import type { ProjectMonetizationPlan } from './ProjectMonetizationPlan';

export function areProjectMonetizationPlansEqual(
  left: ProjectMonetizationPlan,
  right: ProjectMonetizationPlan,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
