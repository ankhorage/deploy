import type { ProjectMonetizationAccess } from './ProjectMonetizationAccess';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';
import type { ProjectMonetizationPlan } from './ProjectMonetizationPlan';

export interface ExecuteProjectMonetizationSyncOptions extends ProjectMonetizationAccess {
  readonly inspection: ProjectMonetizationInspection;
  readonly plan: ProjectMonetizationPlan;
}
