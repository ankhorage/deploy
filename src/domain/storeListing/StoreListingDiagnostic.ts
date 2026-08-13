import type { StoreListingTarget } from './StoreListingAsset';
import type { StoreListingField } from './StoreListingField';

export type StoreListingDiagnosticSeverity = 'error' | 'action-required';

export interface StoreListingDiagnostic {
  readonly severity: StoreListingDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly target?: StoreListingTarget;
  readonly locale?: string;
  readonly field?: StoreListingField;
  readonly variant?: string;
}
