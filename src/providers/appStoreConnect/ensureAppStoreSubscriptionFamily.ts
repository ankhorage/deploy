import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type {
  AppStoreMonetizationFamilyResource,
  AppStoreMonetizationSnapshot,
} from './AppStoreMonetizationSnapshot';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { readAppStoreCollection } from './readAppStoreCollection';

export async function ensureAppStoreSubscriptionFamily(options: {
  readonly appId: string;
  readonly family: string;
  readonly snapshot: AppStoreMonetizationSnapshot;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const cached = uniqueFamily(options.snapshot.families, options.family);
  if (cached === null) return null;
  if (cached !== undefined) return cached.resourceId;
  const current = await readFamilies(options);
  if (current === null) return null;
  const existing = uniqueFamily(current, options.family);
  if (existing === null) return null;
  if (existing !== undefined) return existing.resourceId;
  return createFamily(options);
}

async function readFamilies(
  options: Parameters<typeof ensureAppStoreSubscriptionFamily>[0],
): Promise<readonly AppStoreMonetizationFamilyResource[] | null> {
  const page = await readAppStoreCollection({
    url: appStoreMonetizationUrls.subscriptionGroups(options.appId),
    token: options.token,
    request: options.request,
  });
  if (page === null) return null;
  const result: AppStoreMonetizationFamilyResource[] = [];
  for (const value of page.data) {
    if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
    if (!isString(value.attributes.referenceName)) return null;
    result.push({ resourceId: value.id, referenceName: value.attributes.referenceName });
  }
  return result;
}

function uniqueFamily(
  values: readonly AppStoreMonetizationFamilyResource[],
  family: string,
): AppStoreMonetizationFamilyResource | null | undefined {
  const matches = values.filter((item) => item.referenceName === family);
  if (matches.length > 1) return null;
  const [match] = matches;
  return match;
}

async function createFamily(
  options: Parameters<typeof ensureAppStoreSubscriptionFamily>[0],
): Promise<string | null> {
  const response = await options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createSubscriptionGroup(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'subscriptionGroups',
        attributes: { referenceName: options.family },
        relationships: { app: { data: { type: 'apps', id: options.appId } } },
      },
    }),
  });
  return response.status === 201 ? parseId(response.body) : null;
}

function parseId(body: string): string | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value) || !isRecord(value.data)) return null;
    return value.data.type === 'subscriptionGroups' && isString(value.data.id)
      ? value.data.id
      : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
