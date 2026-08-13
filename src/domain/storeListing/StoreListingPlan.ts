import type { StoreListingDiagnostic } from './StoreListingDiagnostic';
import type { StoreListingPlanStep } from './StoreListingPlanStep';

export interface StoreListingPlan {
  readonly status: 'no-change' | 'changes' | 'blocked';
  readonly desiredRevision: string;
  readonly currentRevision: string;
  readonly steps: readonly StoreListingPlanStep[];
  readonly diagnostics: readonly StoreListingDiagnostic[];
}
