export type MonetizationSubscriptionPeriod = 'P1W' | 'P1M' | 'P2M' | 'P3M' | 'P6M' | 'P1Y';

export interface MonetizationSubscription {
  readonly family: string;
  readonly period: MonetizationSubscriptionPeriod;
  readonly level?: number;
}
