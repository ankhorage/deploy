import { googlePlayMonetizationUrls } from './googlePlayMonetizationUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';

interface GooglePlayMonetizationResources {
  readonly oneTimeProducts: readonly unknown[];
  readonly subscriptions: readonly unknown[];
}

export async function readGooglePlayMonetizationResources(options: {
  readonly packageName: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayMonetizationResources | null> {
  const oneTimeProducts = await readPages({
    ...options,
    key: 'oneTimeProducts',
    url: googlePlayMonetizationUrls.oneTimeList,
  });
  if (oneTimeProducts === null) return null;
  const subscriptions = await readPages({
    ...options,
    key: 'subscriptions',
    url: googlePlayMonetizationUrls.subscriptionsList,
  });
  return subscriptions === null ? null : { oneTimeProducts, subscriptions };
}

async function readPages(options: {
  readonly packageName: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
  readonly key: 'oneTimeProducts' | 'subscriptions';
  readonly url: (packageName: string, pageToken?: string) => string;
}): Promise<readonly unknown[] | null> {
  const items: unknown[] = [];
  let pageToken: string | undefined;
  do {
    const response = await options.request({
      method: 'GET',
      url: options.url(options.packageName, pageToken),
      token: options.token,
    });
    if (response.status < 200 || response.status >= 300) return null;
    const page = parsePage(response.body, options.key);
    if (page === null) return null;
    items.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken !== undefined);
  return items;
}

function parsePage(
  body: string,
  key: 'oneTimeProducts' | 'subscriptions',
): { items: readonly unknown[]; nextPageToken?: string } | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value)) return null;
    const items = readPageItems(value, key);
    if (items === null) return null;
    const token = value.nextPageToken;
    if (token !== undefined && typeof token !== 'string') return null;
    return { items, ...(token === undefined ? {} : { nextPageToken: token }) };
  } catch {
    return null;
  }
}

function readPageItems(
  value: Record<string, unknown>,
  key: 'oneTimeProducts' | 'subscriptions',
): readonly unknown[] | null {
  if (key === 'oneTimeProducts') {
    return Array.isArray(value.oneTimeProducts) ? value.oneTimeProducts : null;
  }
  return Array.isArray(value.subscriptions) ? value.subscriptions : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
