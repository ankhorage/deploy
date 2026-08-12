export interface AppStoreUploadHeader {
  readonly name: string;
  readonly value: string;
}

export interface AppStoreUploadRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: readonly AppStoreUploadHeader[];
  readonly body: Buffer;
}

interface AppStoreUploadResponse {
  readonly status: number;
}

export type AppStoreUploadTransport = (
  request: AppStoreUploadRequest,
) => Promise<AppStoreUploadResponse>;

export const fetchAppStoreUpload: AppStoreUploadTransport = async (request) => {
  const headers = new Headers();
  for (const header of request.headers) headers.append(header.name, header.value);
  const response = await fetch(request.url, {
    method: request.method,
    headers,
    body: request.body,
  });
  return { status: response.status };
};
