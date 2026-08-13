import type { StoreListingTarget } from './StoreListingAsset';
import type { StoreListingDiagnostic } from './StoreListingDiagnostic';

export type StoreListingPlanAction = 'create' | 'update' | 'delete' | 'reorder' | 'no-change';
export type StoreListingResourceKind = 'metadata' | 'asset';

export interface StoreListingPlanOperation {
  readonly target: StoreListingTarget;
  readonly locale: string | null;
  readonly resourceKind: StoreListingResourceKind;
  readonly action: StoreListingPlanAction;
  readonly variant?: string;
  readonly paths?: readonly string[];
}

export interface StoreListingPlan {
  readonly revision: string;
  readonly operations: readonly StoreListingPlanOperation[];
  readonly diagnostics: readonly StoreListingDiagnostic[];
  readonly hasChanges: boolean;
}
