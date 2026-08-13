import type { StoreListingField } from './StoreListingField';
import type { StoreListingTarget } from './StoreListingTarget';

export interface StoreListingDiagnostic {
  readonly severity: 'warning' | 'error';
  readonly code: string;
  readonly message: string;
  readonly target?: StoreListingTarget;
  readonly locale?: string;
  readonly field?: StoreListingField;
  readonly variant?: string;
}
