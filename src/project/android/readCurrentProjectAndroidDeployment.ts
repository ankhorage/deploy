import type {
  DeploymentCurrentState,
  DeploymentObservedAndroidTarget,
} from '../../domain/DeploymentCurrentState';
import type { GooglePlayTrackState } from '../../providers/googlePlay/GooglePlayTrackState';
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
  readonly trackState?: GooglePlayTrackState | null;
}): Promise<DeploymentCurrentState> {
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const evidence = history
    .map(parseEvidence)
    .filter((item): item is AndroidHistoryEvidence => item !== null)
    .filter((item) => matchesRequestedPackage(item, options.packageName))
    .filter((item) => matchesRemoteTrack(item, options.trackState))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
  return evidence === undefined ? { targets: {} } : { targets: { android: observed(evidence) } };
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

function matchesRemoteTrack(item: AndroidHistoryEvidence, trackState: GooglePlayTrackState | null | undefined) {
  if (trackState === undefined) return true;
  if (trackState === null) return false;
  return trackState.releases.some((release) => release.versionCodes.includes(item.versionCode));
}

function observed(item: AndroidHistoryEvidence): DeploymentObservedAndroidTarget {
  return {
    package: item.packageName,
    providers: { build: 'eas', publish: 'google-play' },
    revision: item.revision,
  };
}
