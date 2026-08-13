import type { MonetizationBasePrice } from './MonetizationBasePrice';
import type { MonetizationLocalization } from './MonetizationLocalization';
import type { MonetizationProductKind } from './MonetizationProduct';
import type { MonetizationSubscription } from './MonetizationSubscription';

export interface MonetizationObservedProduct {
  readonly id: string;
  readonly kind: MonetizationProductKind | 'one-time';
  readonly localizations: readonly MonetizationLocalization[];
  readonly basePrice?: MonetizationBasePrice;
  readonly subscription?: MonetizationSubscription;
}
