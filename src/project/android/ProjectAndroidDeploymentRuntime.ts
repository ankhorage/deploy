import { createGooglePlayAccessToken } from '../../providers/googlePlay/GooglePlayTokenFactory';
import type { GooglePlayTokenFactory } from '../../providers/googlePlay/GooglePlayTokenFactory';
import { fetchGooglePlay } from '../../providers/googlePlay/GooglePlayTransport';
import type { GooglePlayTransport } from '../../providers/googlePlay/GooglePlayTransport';
import { downloadAndroidArchive } from '../../providers/googlePlay/downloadAndroidArchive';
import type { AndroidArchiveDownloader } from '../../providers/googlePlay/downloadAndroidArchive';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { runDeploymentProcess } from '../../runtime/process/runDeploymentProcess';

export interface ProjectAndroidDeploymentRuntime {
  readonly runProcess: DeploymentProcessRunner;
  readonly createGooglePlayToken: GooglePlayTokenFactory;
  readonly requestGooglePlay: GooglePlayTransport;
  readonly downloadArchive: AndroidArchiveDownloader;
  readonly now: () => Date;
}

export const projectAndroidDeploymentRuntime: ProjectAndroidDeploymentRuntime = {
  runProcess: runDeploymentProcess,
  createGooglePlayToken: createGooglePlayAccessToken,
  requestGooglePlay: fetchGooglePlay,
  downloadArchive: downloadAndroidArchive,
  now: () => new Date(),
};
