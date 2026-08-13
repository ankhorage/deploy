import type { StoreListingTarget } from './StoreListingTarget';

export type StoreListingPlanOperation = 'create-locale' | 'update-locale' | 'replace-assets';

export interface StoreListingPlanStep {
  readonly id: string;
  readonly target: StoreListingTarget;
  readonly operation: StoreListingPlanOperation;
  readonly locale: string;
  readonly variant?: string;
}
