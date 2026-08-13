import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';

type GooglePlayBlockingStatus = 401 | 403 | null;

export interface GooglePlayRequestTracker {
  readonly request: GooglePlayTransport;
  readonly blockingStatus: () => GooglePlayBlockingStatus;
}

export function trackGooglePlayRequests(
  transport: GooglePlayTransport,
): GooglePlayRequestTracker {
  let blockingStatus: GooglePlayBlockingStatus = null;
  return {
    request: async (request: GooglePlayRequest) => {
      const response = await transport(request);
      if (response.status === 401 || response.status === 403) blockingStatus = response.status;
      return response;
    },
    blockingStatus: () => blockingStatus,
  };
}
