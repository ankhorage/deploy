import type { AppStoreConnectTransport } from './AppStoreConnectTransport';

export interface AppStoreCollectionPage {
  readonly data: readonly unknown[];
  readonly included: readonly unknown[];
}

export async function readAppStoreCollection(options: {
  readonly url: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<AppStoreCollectionPage | null> {
  const data: unknown[] = [];
  const included: unknown[] = [];
  let url: string | undefined = options.url;
  let pages = 0;
  while (url !== undefined) {
    if (pages >= 100) return null;
    const response = await options.request({ method: 'GET', url, token: options.token });
    if (response.status < 200 || response.status >= 300) return null;
    const page = parsePage(response.body);
    if (page === null) return null;
    data.push(...page.data);
    included.push(...page.included);
    url = page.next;
    pages += 1;
  }
  return { data, included };
}

function parsePage(
  body: string,
): { data: readonly unknown[]; included: readonly unknown[]; next?: string } | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value) || !Array.isArray(value.data)) return null;
    const included = Array.isArray(value.included) ? value.included : [];
    const next = readNext(value.links);
    return { data: value.data, included, ...(next === undefined ? {} : { next }) };
  } catch {
    return null;
  }
}

function readNext(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  return typeof value.next === 'string' && value.next.length > 0 ? value.next : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
