import { hasOnlyKeys } from '../../io/hasOnlyKeys';
import { isRecord } from '../../io/isRecord';
import { isProviderSelection } from './providerSelection';
import { isNonEmptyString } from './shared';

const WEB_KEYS = new Set(['target', 'providers']);
const ANDROID_KEYS = new Set(['target', 'package', 'providers']);
const IOS_KEYS = new Set(['target', 'bundleIdentifier', 'providers']);

export function isObservedTarget(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (value.target === 'web') {
    return hasOnlyKeys(value, WEB_KEYS) && isProviderSelection(value.providers);
  }

  if (value.target === 'android') {
    return (
      hasOnlyKeys(value, ANDROID_KEYS) &&
      isNonEmptyString(value.package) &&
      isProviderSelection(value.providers)
    );
  }

  return (
    value.target === 'ios' &&
    hasOnlyKeys(value, IOS_KEYS) &&
    isNonEmptyString(value.bundleIdentifier) &&
    isProviderSelection(value.providers)
  );
}
