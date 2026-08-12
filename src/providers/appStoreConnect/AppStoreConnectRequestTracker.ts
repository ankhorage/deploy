import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';

export type AppStoreConnectBlockingStatus = 401 | 403 | null;

export interface AppStoreConnectRequestTracker {
  readonly request: AppStoreConnectTransport;
  readonly blockingStatus: () => AppStoreConnectBlockingStatus;
}

export function trackAppStoreConnectRequests(
  transport: AppStoreConnectTransport,
): AppStoreConnectRequestTracker {
  let blockingStatus: AppStoreConnectBlockingStatus = null;
  return {
    request: async (request: AppStoreConnectRequest) => {
      const response = await transport(request);
      if (response.status === 401 || response.status === 403) blockingStatus = response.status;
      return response;
    },
    blockingStatus: () => blockingStatus,
  };
}
