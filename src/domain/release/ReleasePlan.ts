import type { ReleaseDiagnostic } from './ReleaseDiagnostic';
import type { ReleasePlanStatus } from './ReleasePlanStatus';
import type { ReleasePlanStep } from './ReleasePlanStep';

export interface ReleasePlan {
  readonly status: ReleasePlanStatus;
  readonly desiredRevision: string;
  readonly currentRevision: string;
  readonly steps: readonly ReleasePlanStep[];
  readonly diagnostics: readonly ReleaseDiagnostic[];
}
