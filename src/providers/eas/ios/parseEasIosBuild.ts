import type { EasIosBuildArtifact } from './EasIosBuildArtifact';

export function parseEasIosBuild(
  value: unknown,
  expectedFingerprint: string,
  expectedProfile: string,
  expectedVersion: string,
): EasIosBuildArtifact | null {
  if (!Array.isArray(value) || value.length !== 1 || !isRecord(value[0])) return null;
  const build = value[0];
  if (build.status !== 'FINISHED' || build.platform !== 'IOS') return null;
  if (!isNonEmptyString(build.id) || build.buildProfile !== expectedProfile) return null;
  if (!isRecord(build.fingerprint) || build.fingerprint.hash !== expectedFingerprint) return null;
  if (!isRecord(build.artifacts) || !isHttpUrl(build.artifacts.applicationArchiveUrl)) return null;
  if (build.appVersion !== expectedVersion || !isNonEmptyString(build.appBuildVersion)) return null;
  return {
    buildId: build.id,
    buildProfile: expectedProfile,
    fingerprint: expectedFingerprint,
    version: expectedVersion,
    buildNumber: build.appBuildVersion,
    archiveUrl: build.artifacts.applicationArchiveUrl,
  };
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
