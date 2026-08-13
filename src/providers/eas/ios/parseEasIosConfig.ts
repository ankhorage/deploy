import type { EasIosConfigResult, EasIosConfigSnapshot } from './inspectEasIosConfig';

export function parseEasIosConfig(
  value: unknown,
  expectedBundleIdentifier: string,
): EasIosConfigResult {
  if (!isRecord(value) || !isRecord(value.buildProfile) || !isRecord(value.appConfig)) {
    return failure('EAS_IOS_CONFIG_INVALID');
  }
  const iosConfig = value.appConfig.ios;
  if (!isRecord(iosConfig) || !isNonEmptyString(iosConfig.bundleIdentifier)) {
    return failure('EAS_IOS_BUNDLE_IDENTIFIER_MISSING');
  }
  if (iosConfig.bundleIdentifier !== expectedBundleIdentifier) {
    return failure(
      'IOS_BUNDLE_IDENTIFIER_MISMATCH',
      'EAS iOS bundle identifier does not match deployment config.',
    );
  }
  if (!isStoreProfile(value.buildProfile)) {
    return failure('EAS_IOS_PROFILE_NOT_STORE_READY', 'EAS iOS build profile is not store-ready.');
  }
  const environment = normalizeEnvironment(value.buildProfile.env);
  if (environment === null) return failure('EAS_IOS_CONFIG_INVALID');
  const config: EasIosConfigSnapshot = {
    bundleIdentifier: iosConfig.bundleIdentifier,
    profileEnvironment: environment,
  };
  return { status: 'completed', config };
}

function isStoreProfile(profile: Record<string, unknown>): boolean {
  if (profile.developmentClient === true || profile.distribution === 'internal') return false;
  if (profile.withoutCredentials === true) return false;
  if (profile.ios === undefined) return true;
  if (!isRecord(profile.ios)) return false;
  if (profile.ios.simulator === true || profile.ios.withoutCredentials === true) return false;
  return profile.ios.distribution !== 'internal';
}

function normalizeEnvironment(value: unknown): Readonly<Record<string, string>> | null {
  if (value === undefined) return {};
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.some(([, item]) => typeof item !== 'string')) return null;
  return Object.fromEntries(entries) as Readonly<Record<string, string>>;
}

function failure(code: string, message = 'EAS iOS configuration is invalid.'): EasIosConfigResult {
  return { status: 'failed', failure: { code, message, target: 'ios', provider: 'eas' } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
