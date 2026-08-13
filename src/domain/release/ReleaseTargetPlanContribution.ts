import type { ReleaseDiagnostic } from './ReleaseDiagnostic';
import type { ReleasePlanStep } from './ReleasePlanStep';

export interface ReleaseTargetPlanContribution {
  readonly steps: readonly ReleasePlanStep[];
  readonly diagnostics: readonly ReleaseDiagnostic[];
  readonly waiting: boolean;
  readonly complete: boolean;
  readonly terminalStepId?: string;
}
