export interface AppStoreConnectRequest {
  readonly method: 'DELETE' | 'GET' | 'POST' | 'PATCH';
  readonly url: string;
  readonly token: string;
  readonly body?: string;
}

export interface AppStoreConnectResponse {
  readonly status: number;
  readonly body: string;
}

export type AppStoreConnectTransport = (
  request: AppStoreConnectRequest,
) => Promise<AppStoreConnectResponse>;

export const fetchAppStoreConnect: AppStoreConnectTransport = async (request) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${request.token}`,
    Accept: 'application/json',
  };
  if (request.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(request.url, {
    method: request.method,
    headers,
    ...(request.body === undefined ? {} : { body: request.body }),
  });
  return { status: response.status, body: await response.text() };
};
