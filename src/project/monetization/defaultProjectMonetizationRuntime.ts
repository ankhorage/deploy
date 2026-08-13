import { createAppStoreConnectToken } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import { fetchAppStoreConnect } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import { createGooglePlayAccessToken } from '../../providers/googlePlay/GooglePlayTokenFactory';
import { fetchGooglePlay } from '../../providers/googlePlay/GooglePlayTransport';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';

export const defaultProjectMonetizationRuntime: ProjectMonetizationRuntime = {
  createGooglePlayToken: createGooglePlayAccessToken,
  requestGooglePlay: fetchGooglePlay,
  createAppStoreConnectToken,
  requestAppStoreConnect: fetchAppStoreConnect,
  now: () => new Date(),
};
