import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

export const DEPLOYMENT_PLAN_DIAGNOSTIC_CODES = [
  'TARGET_PLANNER_UNAVAILABLE',
  'CONTRIBUTOR_TARGET_MISMATCH',
  'TARGET_PLANNER_FAILED',
  'STEP_TARGET_MISMATCH',
  'DUPLICATE_STEP_ID',
  'UNDECLARED_CAPABILITY',
  'INVALID_STEP_ID',
] as const;

export type DeploymentPlanDiagnosticCode = (typeof DEPLOYMENT_PLAN_DIAGNOSTIC_CODES)[number];

export interface DeploymentPlanDiagnostic {
  readonly code: DeploymentPlanDiagnosticCode;
  readonly target: AppDeployTargetId;
  readonly message: string;
  readonly stepId?: string;
}
