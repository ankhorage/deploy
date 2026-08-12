import type { AppStoreUploadTransport } from './AppStoreUploadTransport';
import type { BuildUploadOperation } from './BuildUploadOperation';

export async function executeBuildUploadOperations(options: {
  readonly file: Buffer;
  readonly operations: readonly BuildUploadOperation[];
  readonly upload: AppStoreUploadTransport;
}): Promise<boolean> {
  for (const operation of options.operations) {
    const body = options.file.subarray(operation.offset, operation.offset + operation.length);
    const response = await options.upload({
      method: operation.method,
      url: operation.url,
      headers: operation.headers,
      body,
    });
    if (response.status < 200 || response.status >= 300) return false;
  }
  return true;
}
