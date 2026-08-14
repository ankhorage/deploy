import type { AppStoreConnectTokenFactory } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import type { executeAppStoreReleaseControl } from '../../providers/appStoreConnect/executeAppStoreReleaseControl';
import type { executeAppStoreReleaseMutation } from '../../providers/appStoreConnect/executeAppStoreReleaseMutation';
import type { executeGooglePlayReleaseControl } from '../../providers/googlePlay/executeGooglePlayReleaseControl';
import type { executeGooglePlayReleaseMutation } from '../../providers/googlePlay/executeGooglePlayReleaseMutation';
import type { GooglePlayTokenFactory } from '../../providers/googlePlay/GooglePlayTokenFactory';
import type { GooglePlayTransport } from '../../providers/googlePlay/GooglePlayTransport';
import type { publishProjectReleaseAndroid } from './publishProjectReleaseAndroid';
import type { publishProjectReleaseIos } from './publishProjectReleaseIos';
import type { publishProjectReleaseWeb } from './publishProjectReleaseWeb';

export interface ProjectReleaseRuntime {
  readonly createGooglePlayToken: GooglePlayTokenFactory;
  readonly requestGooglePlay: GooglePlayTransport;
  readonly createAppStoreConnectToken: AppStoreConnectTokenFactory;
  readonly requestAppStoreConnect: AppStoreConnectTransport;
  readonly executeGooglePlayMutation: typeof executeGooglePlayReleaseMutation;
  readonly executeAppStoreMutation: typeof executeAppStoreReleaseMutation;
  readonly executeGooglePlayControl: typeof executeGooglePlayReleaseControl;
  readonly executeAppStoreControl: typeof executeAppStoreReleaseControl;
  readonly publishWeb: typeof publishProjectReleaseWeb;
  readonly publishAndroid: typeof publishProjectReleaseAndroid;
  readonly publishIos: typeof publishProjectReleaseIos;
  readonly now: () => Date;
}
