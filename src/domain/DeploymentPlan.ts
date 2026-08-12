import type { DeploymentPlanDiagnostic } from './DeploymentPlanDiagnostic';
import type { DeploymentPlanStep } from './DeploymentPlanStep';
import type { DeploymentTargetChange } from './DeploymentTargetChange';

export interface DeploymentPlan {
  readonly changes: readonly DeploymentTargetChange[];
  readonly steps: readonly DeploymentPlanStep[];
  readonly diagnostics: readonly DeploymentPlanDiagnostic[];
  readonly executable: boolean;
}
