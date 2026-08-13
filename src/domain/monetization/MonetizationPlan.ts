import type { MonetizationDiagnostic } from './MonetizationDiagnostic';
import type { MonetizationPlanStep } from './MonetizationPlanStep';

export interface MonetizationPlan {
  readonly status: 'no-change' | 'changes' | 'blocked';
  readonly desiredRevision: string;
  readonly currentRevision: string;
  readonly steps: readonly MonetizationPlanStep[];
  readonly diagnostics: readonly MonetizationDiagnostic[];
}
