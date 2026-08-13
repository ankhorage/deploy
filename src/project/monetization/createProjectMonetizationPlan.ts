import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';
import type { ProjectMonetizationPlan } from './ProjectMonetizationPlan';

export function createProjectMonetizationPlan(
  inspection: ProjectMonetizationInspection,
): ProjectMonetizationPlan {
  const plan = createMonetizationPlan({
    desired: inspection.desired,
    currentRevision: inspection.currentRevision,
    states: inspection.states,
  });
  return {
    ...plan,
    status: inspection.actions.length > 0 ? 'blocked' : plan.status,
    actions: inspection.actions,
  };
}
