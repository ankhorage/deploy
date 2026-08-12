import type { EasAndroidBuildArtifact } from './EasAndroidBuildArtifact';

export function parseEasAndroidBuild(
  value: unknown,
  expectedFingerprint: string,
  expectedProfile: string,
): EasAndroidBuildArtifact | null {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) return null;
  const build = value[0];
  if (build.status !== 'FINISHED' || build.platform !== 'ANDROID') return null;
  if (!isNonEmptyString(build.id) || build.buildProfile !== expectedProfile) return null;
  if (!isRecord(build.fingerprint) || build.fingerprint.hash !== expectedFingerprint) return null;
  if (!isRecord(build.artifacts) || !isHttpUrl(build.artifacts.applicationArchiveUrl)) return null;
  const versionCode = parseVersionCode(build.appBuildVersion);
  if (versionCode === null) return null;
  return {
    buildId: build.id,
    buildProfile: expectedProfile,
    fingerprint: expectedFingerprint,
    versionCode,
    archiveUrl: build.artifacts.applicationArchiveUrl,
  };
}

function parseVersionCode(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isHttpUrl(value: unknown): value is string {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
