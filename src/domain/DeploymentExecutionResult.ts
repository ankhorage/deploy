import type { DeploymentFailure } from './DeploymentFailure';
import type { DeploymentPlanDiagnostic } from './DeploymentPlanDiagnostic';
import type { DeploymentPlanStep } from './DeploymentPlanStep';
import type { DeploymentRequiredAction } from './DeploymentRequiredAction';
import type { DeploymentStepOutcome } from './DeploymentStepOutcome';

export interface DeploymentStepExecutionRecord {
  readonly step: DeploymentPlanStep;
  readonly outcome: DeploymentStepOutcome;
}

export type DeploymentExecutionResult =
  | {
      readonly status: 'blocked';
      readonly diagnostics: readonly DeploymentPlanDiagnostic[];
      readonly records: readonly DeploymentStepExecutionRecord[];
    }
  | {
      readonly status: 'completed';
      readonly records: readonly DeploymentStepExecutionRecord[];
    }
  | {
      readonly status: 'action-required';
      readonly action: DeploymentRequiredAction;
      readonly records: readonly DeploymentStepExecutionRecord[];
    }
  | {
      readonly status: 'failed';
      readonly failure: DeploymentFailure;
      readonly records: readonly DeploymentStepExecutionRecord[];
    };
