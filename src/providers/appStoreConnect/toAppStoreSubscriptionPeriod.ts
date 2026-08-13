import type { MonetizationSubscriptionPeriod } from '../../domain/monetization/MonetizationSubscription';

const PERIOD_PAIRS: readonly (readonly [MonetizationSubscriptionPeriod, string])[] = [
  ['P1W', 'ONE_WEEK'],
  ['P1M', 'ONE_MONTH'],
  ['P2M', 'TWO_MONTHS'],
  ['P3M', 'THREE_MONTHS'],
  ['P6M', 'SIX_MONTHS'],
  ['P1Y', 'ONE_YEAR'],
];

export function toAppStoreSubscriptionPeriod(period: MonetizationSubscriptionPeriod): string {
  const match = PERIOD_PAIRS.find(([canonical]) => canonical === period);
  if (match === undefined) throw new Error('APP_STORE_SUBSCRIPTION_PERIOD_INVALID');
  return match[1];
}
