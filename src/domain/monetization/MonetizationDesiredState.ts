import type { MonetizationProduct } from './MonetizationProduct';

export interface MonetizationDesiredState {
  readonly revision: string;
  readonly products: readonly MonetizationProduct[];
}
