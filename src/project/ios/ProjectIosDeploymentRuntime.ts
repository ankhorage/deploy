import { promises as fs } from 'node:fs';

import { createAppStoreConnectToken } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import type { AppStoreConnectTokenFactory } from '../../providers/appStoreConnect/AppStoreConnectTokenFactory';
import { fetchAppStoreConnect } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import type { AppStoreConnectTransport } from '../../providers/appStoreConnect/AppStoreConnectTransport';
import { fetchAppStoreUpload } from '../../providers/appStoreConnect/AppStoreUploadTransport';
import type { AppStoreUploadTransport } from '../../providers/appStoreConnect/AppStoreUploadTransport';
import {
  cleanupIosArchive,
  downloadIosArchive,
  type IosArchiveDownloader,
} from '../../providers/appStoreConnect/downloadIosArchive';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { runDeploymentProcess } from '../../runtime/process/runDeploymentProcess';

export interface ProjectIosDeploymentRuntime {
  readonly runProcess: DeploymentProcessRunner;
  readonly createAppStoreConnectToken: AppStoreConnectTokenFactory;
  readonly requestAppStoreConnect: AppStoreConnectTransport;
  readonly uploadAppStore: AppStoreUploadTransport;
  readonly downloadArchive: IosArchiveDownloader;
  readonly readArchive: (filePath: string) => Promise<Buffer>;
  readonly cleanupArchive: (directory: string) => Promise<void>;
  readonly waitForAppStoreProcessing: () => Promise<void>;
  readonly maxAppStoreProcessingAttempts: number;
  readonly now: () => Date;
}

export const projectIosDeploymentRuntime: ProjectIosDeploymentRuntime = {
  runProcess: runDeploymentProcess,
  createAppStoreConnectToken,
  requestAppStoreConnect: fetchAppStoreConnect,
  uploadAppStore: fetchAppStoreUpload,
  downloadArchive: downloadIosArchive,
  readArchive: (filePath) => fs.readFile(filePath),
  cleanupArchive: cleanupIosArchive,
  waitForAppStoreProcessing: () => delay(5_000),
  maxAppStoreProcessingAttempts: 120,
  now: () => new Date(),
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
