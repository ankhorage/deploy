import { createAppStoreConnectToken } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import { fetchAppStoreConnect } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import { executeAppStoreReleaseControl } from '../../providers/appStoreConnect/executeAppStoreReleaseControl';
import { executeAppStoreReleaseMutation } from '../../providers/appStoreConnect/executeAppStoreReleaseMutation';
import { executeGooglePlayReleaseControl } from '../../providers/googlePlay/executeGooglePlayReleaseControl';
import { executeGooglePlayReleaseMutation } from '../../providers/googlePlay/executeGooglePlayReleaseMutation';
import { createGooglePlayAccessToken } from '../../providers/googlePlay/GooglePlayTokenFactory';
import { fetchGooglePlay } from '../../providers/googlePlay/GooglePlayTransport';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { publishProjectReleaseAndroid } from './publishProjectReleaseAndroid';
import { publishProjectReleaseIos } from './publishProjectReleaseIos';
import { publishProjectReleaseWeb } from './publishProjectReleaseWeb';

export const defaultProjectReleaseRuntime: ProjectReleaseRuntime = {
  createGooglePlayToken: createGooglePlayAccessToken,
  requestGooglePlay: fetchGooglePlay,
  createAppStoreConnectToken,
  requestAppStoreConnect: fetchAppStoreConnect,
  executeGooglePlayMutation: executeGooglePlayReleaseMutation,
  executeAppStoreMutation: executeAppStoreReleaseMutation,
  executeGooglePlayControl: executeGooglePlayReleaseControl,
  executeAppStoreControl: executeAppStoreReleaseControl,
  publishWeb: publishProjectReleaseWeb,
  publishAndroid: publishProjectReleaseAndroid,
  publishIos: publishProjectReleaseIos,
  now: () => new Date(),
};
