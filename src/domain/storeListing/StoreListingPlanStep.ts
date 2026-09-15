import type { StoreListingTarget } from './StoreListingTarget';

export interface StoreListingPlanStep {
  readonly id: string;
  readonly target: StoreListingTarget;
  readonly operation: 'create-locale' | 'update-locale' | 'replace-assets';
  readonly locale: string;
  readonly variant?: string;
}
