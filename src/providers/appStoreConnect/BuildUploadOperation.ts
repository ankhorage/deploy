import type { AppStoreUploadHeader } from './AppStoreUploadTransport';

export interface BuildUploadOperation {
  readonly offset: number;
  readonly length: number;
  readonly method: string;
  readonly url: string;
  readonly headers: readonly AppStoreUploadHeader[];
}

export interface BuildUploadFileReservation {
  readonly fileId: string;
  readonly operations: readonly BuildUploadOperation[];
}
