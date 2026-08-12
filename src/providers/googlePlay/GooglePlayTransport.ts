export interface GooglePlayRequest {
  readonly method: 'GET' | 'POST' | 'PUT';
  readonly url: string;
  readonly token: string;
  readonly contentType?: string;
  readonly body?: string | Blob;
}

interface GooglePlayResponse {
  readonly status: number;
  readonly body: string;
}

export type GooglePlayTransport = (request: GooglePlayRequest) => Promise<GooglePlayResponse>;

export const fetchGooglePlay: GooglePlayTransport = async (request) => {
  const headers: Record<string, string> = { Authorization: `Bearer ${request.token}` };
  if (request.contentType !== undefined) headers['Content-Type'] = request.contentType;
  const response = await fetch(request.url, {
    method: request.method,
    headers,
    ...(request.body === undefined ? {} : { body: request.body }),
  });
  return { status: response.status, body: await response.text() };
};
