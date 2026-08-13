import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { ProjectMonetizationInspection } from './ProjectMonetizationInspection';

export type ProjectMonetizationInspectionResult =
  | { readonly ok: true; readonly inspection: ProjectMonetizationInspection }
  | { readonly ok: false; readonly failure: DeploymentFailure };
