import type { MonetizationBasePrice } from './MonetizationBasePrice';
import type { MonetizationLocalization } from './MonetizationLocalization';
import type { MonetizationSubscription } from './MonetizationSubscription';

export type MonetizationProductKind = 'consumable' | 'non-consumable' | 'subscription';

export interface MonetizationProduct {
  readonly id: string;
  readonly kind: MonetizationProductKind;
  readonly localizations: readonly MonetizationLocalization[];
  readonly basePrice: MonetizationBasePrice;
  readonly subscription?: MonetizationSubscription;
}
