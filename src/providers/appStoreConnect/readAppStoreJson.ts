import type { AppStoreConnectTransport } from './AppStoreConnectTransport';

export async function readAppStoreJson(options: {
  readonly url: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<unknown> {
  const response = await options.request({ method: 'GET', ...options });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    return JSON.parse(response.body) as unknown;
  } catch {
    return null;
  }
}
