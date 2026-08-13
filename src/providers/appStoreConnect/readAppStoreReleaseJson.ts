import type { AppStoreConnectTransport } from './AppStoreConnectTransport';

export async function readAppStoreReleaseJson(options: {
  readonly url: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<{ readonly status: number; readonly value: unknown } | null> {
  try {
    const response = await options.request({ method: 'GET', ...options });
    if (response.status < 200 || response.status >= 300) {
      return { status: response.status, value: null };
    }
    try {
      return { status: response.status, value: JSON.parse(response.body) as unknown };
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
