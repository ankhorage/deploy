import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';

export function parseEasWebPublication(
  value: unknown,
  revision: string,
  production: boolean,
): WebDeploymentPublication | null {
  if (!isRecord(value) || !isNonEmptyString(value.identifier) || !isHttpUrl(value.url)) {
    return null;
  }
  return {
    target: 'web',
    revision,
    provider: 'eas',
    deploymentId: value.identifier,
    url: value.url,
    production,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
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
