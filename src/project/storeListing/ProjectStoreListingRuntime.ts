import {
  createAppStoreConnectToken,
  type AppStoreConnectTokenFactory,
} from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import {
  fetchAppStoreConnect,
  type AppStoreConnectTransport,
} from '../../providers/appStoreConnect/AppStoreConnectTransport';
import {
  fetchAppStoreUpload,
  type AppStoreUploadTransport,
} from '../../providers/appStoreConnect/AppStoreUploadTransport';
import {
  createGooglePlayAccessToken,
  type GooglePlayTokenFactory,
} from '../../providers/googlePlay/GooglePlayTokenFactory';
import {
  fetchGooglePlay,
  type GooglePlayTransport,
} from '../../providers/googlePlay/GooglePlayTransport';

export interface ProjectStoreListingRuntime {
  readonly createGooglePlayToken: GooglePlayTokenFactory;
  readonly requestGooglePlay: GooglePlayTransport;
  readonly createAppStoreConnectToken: AppStoreConnectTokenFactory;
  readonly requestAppStoreConnect: AppStoreConnectTransport;
  readonly uploadAppStore: AppStoreUploadTransport;
  readonly waitForAppStoreProcessing: () => Promise<void>;
  readonly maxAppStoreProcessingAttempts: number;
  readonly now: () => Date;
}

export const projectStoreListingRuntime: ProjectStoreListingRuntime = {
  createGooglePlayToken: createGooglePlayAccessToken,
  requestGooglePlay: fetchGooglePlay,
  createAppStoreConnectToken,
  requestAppStoreConnect: fetchAppStoreConnect,
  uploadAppStore: fetchAppStoreUpload,
  waitForAppStoreProcessing: () => delay(5_000),
  maxAppStoreProcessingAttempts: 120,
  now: () => new Date(),
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
