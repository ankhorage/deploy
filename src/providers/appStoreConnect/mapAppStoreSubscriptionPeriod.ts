import type { MonetizationSubscriptionPeriod } from '../../domain/monetization/MonetizationSubscription';

const PERIOD_PAIRS: readonly (readonly [MonetizationSubscriptionPeriod, string])[] = [
  ['P1W', 'ONE_WEEK'],
  ['P1M', 'ONE_MONTH'],
  ['P2M', 'TWO_MONTHS'],
  ['P3M', 'THREE_MONTHS'],
  ['P6M', 'SIX_MONTHS'],
  ['P1Y', 'ONE_YEAR'],
];

export function fromAppStoreSubscriptionPeriod(
  value: unknown,
): MonetizationSubscriptionPeriod | null {
  if (typeof value !== 'string') return null;
  return PERIOD_PAIRS.find(([, provider]) => provider === value)?.[0] ?? null;
}
