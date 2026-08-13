import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import type { AppStoreProductVersion } from './AppStoreProductVersion';
import { readAppStoreCollection } from './readAppStoreCollection';
import { readAppStoreVersionLocalizations } from './readAppStoreVersionLocalizations';

interface VersionCandidate {
  readonly resourceId: string;
  readonly version: number;
  readonly state: string;
}

export async function readAppStoreProductVersion(options: {
  readonly kind: 'iap' | 'subscription';
  readonly productId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<AppStoreProductVersion | null | undefined> {
  const url =
    options.kind === 'iap'
      ? appStoreMonetizationUrls.iapVersions(options.productId)
      : appStoreMonetizationUrls.subscriptionVersions(options.productId);
  const page = await readAppStoreCollection({ ...options, url });
  if (page === null) return null;
  const candidates = parseCandidates(page.data);
  if (candidates === null) return null;
  const selected = selectCandidate(candidates);
  if (selected === null) return null;
  if (selected === undefined) return undefined;
  const localizations = await readAppStoreVersionLocalizations({
    ...options,
    versionId: selected.resourceId,
  });
  return localizations === null
    ? null
    : { resourceId: selected.resourceId, state: selected.state, localizations };
}

function parseCandidates(values: readonly unknown[]): readonly VersionCandidate[] | null {
  const result: VersionCandidate[] = [];
  for (const value of values) {
    if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
    const { version, state } = value.attributes;
    if (!isPositiveInteger(version) || !isString(state)) return null;
    result.push({ resourceId: value.id, version, state });
  }
  return result;
}

function selectCandidate(values: readonly VersionCandidate[]): VersionCandidate | null | undefined {
  const drafts = values.filter((item) => item.state === 'PREPARE_FOR_SUBMISSION');
  if (drafts.length === 1) return drafts[0];
  if (drafts.length > 1) return null;
  return values.slice().sort((a, b) => b.version - a.version)[0];
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
