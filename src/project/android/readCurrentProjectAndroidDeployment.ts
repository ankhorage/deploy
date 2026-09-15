import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';
import type { AndroidPublishInspection } from '@ankhorage/contracts/deploy-provider';

import type {
  DeploymentCurrentState,
  DeploymentObservedAndroidTarget,
} from '../../domain/DeploymentCurrentState';
import type { ProjectDeploymentHistoryRecord } from '../history/ProjectDeploymentHistoryRecord';
import { listProjectDeploymentHistory } from '../history/listProjectDeploymentHistory';

interface AndroidHistoryEvidence {
  readonly revision: string;
  readonly versionCode: number;
  readonly packageName: string;
  readonly recordedAt: string;
}

export async function readCurrentProjectAndroidDeployment(options: {
  readonly projectRoot: string;
  readonly packageName?: string;
  readonly providers?: AppDeployProviderSelection;
  readonly publishInspection?: AndroidPublishInspection | null;
}): Promise<DeploymentCurrentState> {
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const evidence = history
    .map(parseEvidence)
    .filter((item): item is AndroidHistoryEvidence => item !== null)
    .filter((item) => matchesRequestedPackage(item, options.packageName))
    .filter((item) => matchesRemotePublication(item, options.publishInspection))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
  return evidence === undefined
    ? { targets: {} }
    : { targets: { android: observed(evidence, options.providers) } };
}

function parseEvidence(record: ProjectDeploymentHistoryRecord): AndroidHistoryEvidence | null {
  if (record.execution.status !== 'completed' || record.verification?.ok !== true) return null;
  const match = /^android-(\d+)-([a-f\d]{64})$/i.exec(record.deploymentId);
  if (match === null) return null;
  const versionCode = Number(match[1]);
  const revision = match[2];
  if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || revision === undefined) return null;
  const desired = record.plan.changes.find((change) => change.target === 'android')?.desired;
  if (desired?.target !== 'android') return null;
  return { revision, versionCode, packageName: desired.package, recordedAt: record.recordedAt };
}

function matchesRequestedPackage(item: AndroidHistoryEvidence, packageName: string | undefined) {
  return packageName === undefined || item.packageName === packageName;
}

function matchesRemotePublication(
  item: AndroidHistoryEvidence,
  inspection: AndroidPublishInspection | null | undefined,
) {
  if (inspection === undefined) return true;
  if (inspection === null) return false;
  return inspection.activeVersionCodes.includes(item.versionCode);
}

function observed(
  item: AndroidHistoryEvidence,
  providers: AppDeployProviderSelection | undefined,
): DeploymentObservedAndroidTarget {
  return {
    package: item.packageName,
    ...(providers === undefined ? {} : { providers }),
    revision: item.revision,
  };
}
