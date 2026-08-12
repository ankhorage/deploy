import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isNonEmptyString } from './shared';

const PROVIDER_KEYS = new Set(['build', 'publish']);

export function isProviderSelection(value: unknown): boolean {
  if (value === undefined) return true;
  if (!isRecord(value) || !hasOnlyKeys(value, PROVIDER_KEYS)) return false;

  return (
    (value.build === undefined || isNonEmptyString(value.build)) &&
    (value.publish === undefined || isNonEmptyString(value.publish))
  );
}
