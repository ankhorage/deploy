import type { EasAndroidConfigResult, EasAndroidConfigSnapshot } from './inspectEasAndroidConfig';

export function parseEasAndroidConfig(
  value: unknown,
  expectedPackage: string,
): EasAndroidConfigResult {
  if (!isRecord(value) || !isRecord(value.buildProfile) || !isRecord(value.appConfig)) {
    return failure('EAS_ANDROID_CONFIG_INVALID');
  }
  const androidConfig = value.appConfig.android;
  if (!isRecord(androidConfig) || !isNonEmptyString(androidConfig.package)) {
    return failure('EAS_ANDROID_PACKAGE_MISSING');
  }
  if (androidConfig.package !== expectedPackage) {
    return failure('ANDROID_PACKAGE_MISMATCH', 'EAS Android package does not match deployment config.');
  }
  if (!isStoreProfile(value.buildProfile)) {
    return failure('EAS_ANDROID_PROFILE_NOT_STORE_READY', 'EAS Android build profile is not store-ready.');
  }
  const environment = normalizeEnvironment(value.buildProfile.env);
  if (environment === null) return failure('EAS_ANDROID_CONFIG_INVALID');
  const config: EasAndroidConfigSnapshot = {
    packageName: androidConfig.package,
    profileEnvironment: environment,
  };
  return { status: 'completed', config };
}

function isStoreProfile(profile: Record<string, unknown>): boolean {
  if (profile.developmentClient === true || profile.distribution === 'internal') return false;
  if (profile.withoutCredentials === true) return false;
  if (profile.android === undefined) return true;
  if (!isRecord(profile.android)) return false;
  if (profile.android.distribution === 'internal' || profile.android.withoutCredentials === true) {
    return false;
  }
  if (profile.android.buildType === 'apk') return false;
  return profile.android.gradleCommand === undefined;
}

function normalizeEnvironment(value: unknown): Readonly<Record<string, string>> | null {
  if (value === undefined) return {};
  if (!isRecord(value)) return null;
  const entries = Object.entries(value);
  if (entries.some(([, item]) => typeof item !== 'string')) return null;
  return Object.fromEntries(entries) as Readonly<Record<string, string>>;
}

function failure(code: string, message = 'EAS Android configuration is invalid.'): EasAndroidConfigResult {
  return { status: 'failed', failure: { code, message, target: 'android', provider: 'eas' } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
