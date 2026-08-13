import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';

export function toGooglePlayMoney(
  price: MonetizationBasePrice,
): Readonly<Record<string, string | number>> {
  const separator = price.amount.indexOf('.');
  const units = separator === -1 ? price.amount : price.amount.slice(0, separator);
  const fraction = separator === -1 ? '' : price.amount.slice(separator + 1);
  return {
    currencyCode: price.currency,
    units,
    nanos: Number(fraction.padEnd(9, '0')),
  };
}
