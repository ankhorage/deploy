export function normalizeReleaseFraction(value: string | undefined): string | undefined {
  if (value === undefined || !/^0\.\d+$/.test(value)) return value;
  const digits = value.slice(2).replace(/0+$/, '');
  return digits.length === 0 ? '0' : `0.${digits}`;
}
