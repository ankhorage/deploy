import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectBuildUploadUrl } from './appStoreConnectUrls';

export interface ProcessedAppStoreBuild {
  readonly buildId: string;
  readonly buildNumber: string;
}

export async function waitForAppStoreBuildUpload(options: {
  readonly buildUploadId: string;
  readonly expectedBuildNumber: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly wait: () => Promise<void>;
  readonly maxAttempts: number;
}): Promise<ProcessedAppStoreBuild | null> {
  for (let attempt = 0; attempt < options.maxAttempts; attempt += 1) {
    const result = await readBuildUpload(options);
    if (result.status === 'complete') return result.build;
    if (result.status === 'failed') return null;
    if (attempt + 1 < options.maxAttempts) await options.wait();
  }
  return null;
}

type BuildUploadRead =
  | { readonly status: 'pending' }
  | { readonly status: 'failed' }
  | { readonly status: 'complete'; readonly build: ProcessedAppStoreBuild };

async function readBuildUpload(options: {
  readonly buildUploadId: string;
  readonly expectedBuildNumber: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<BuildUploadRead> {
  const response = await options.request({
    method: 'GET',
    url: appStoreConnectBuildUploadUrl(options.buildUploadId),
    token: options.token,
  });
  if (response.status < 200 || response.status >= 300) return { status: 'failed' };
  try {
    return parseBuildUpload(JSON.parse(response.body) as unknown, options.expectedBuildNumber);
  } catch {
    return { status: 'failed' };
  }
}

function parseBuildUpload(value: unknown, expectedBuildNumber: string): BuildUploadRead {
  if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.attributes)) {
    return { status: 'failed' };
  }
  const state = parseState(value.data.attributes.state);
  if (state === 'FAILED') return { status: 'failed' };
  if (state !== 'COMPLETE') return { status: 'pending' };
  const build = findBuild(value.included, expectedBuildNumber);
  return build === null ? { status: 'failed' } : { status: 'complete', build };
}

function parseState(value: unknown): string | null {
  if (typeof value === 'string') return value;
  return isRecord(value) && typeof value.state === 'string' ? value.state : null;
}

function findBuild(value: unknown, expectedBuildNumber: string): ProcessedAppStoreBuild | null {
  if (!Array.isArray(value)) return null;
  for (const candidate of value as unknown[]) {
    const build = parseBuild(candidate, expectedBuildNumber);
    if (build !== null) return build;
  }
  return null;
}

function parseBuild(value: unknown, expectedBuildNumber: string): ProcessedAppStoreBuild | null {
  if (!isRecord(value) || value.type !== 'builds' || !isRecord(value.attributes)) return null;
  if (value.attributes.version !== expectedBuildNumber || !isNonEmptyString(value.id)) return null;
  return { buildId: value.id, buildNumber: expectedBuildNumber };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
