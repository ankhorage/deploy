import type { AppStoreConnectTokenFactory } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import type { GooglePlayTokenFactory } from '../../providers/googlePlay/GooglePlayTokenFactory';
import type { GooglePlayTransport } from '../../providers/googlePlay/GooglePlayTransport';

export interface ProjectMonetizationRuntime {
  readonly createGooglePlayToken: GooglePlayTokenFactory;
  readonly requestGooglePlay: GooglePlayTransport;
  readonly createAppStoreConnectToken: AppStoreConnectTokenFactory;
  readonly requestAppStoreConnect: AppStoreConnectTransport;
  readonly now: () => Date;
}
