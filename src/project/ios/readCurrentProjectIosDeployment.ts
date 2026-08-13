import type {
  DeploymentCurrentState,
  DeploymentObservedIosTarget,
} from '../../domain/DeploymentCurrentState';
import type { AppStoreConnectIosState } from '../../providers/appStoreConnect/AppStoreConnectIosState';
import type { ProjectDeploymentHistoryRecord } from '../history/ProjectDeploymentHistoryRecord';
import { listProjectDeploymentHistory } from '../history/listProjectDeploymentHistory';

interface IosHistoryEvidence {
  readonly revision: string;
  readonly buildNumber: string;
  readonly bundleIdentifier: string;
  readonly recordedAt: string;
}

export async function readCurrentProjectIosDeployment(options: {
  readonly projectRoot: string;
  readonly bundleIdentifier?: string;
  readonly appStoreState?: AppStoreConnectIosState | null;
}): Promise<DeploymentCurrentState> {
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const evidence = history
    .map(parseEvidence)
    .filter((item): item is IosHistoryEvidence => item !== null)
    .filter((item) => matchesRequestedBundle(item, options.bundleIdentifier))
    .filter((item) => matchesRemoteBuild(item, options.appStoreState))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
  return evidence === undefined ? { targets: {} } : { targets: { ios: observed(evidence) } };
}

function parseEvidence(record: ProjectDeploymentHistoryRecord): IosHistoryEvidence | null {
  if (record.execution.status !== 'completed' || record.verification?.ok !== true) return null;
  const match = /^ios-(.+)-([a-f\d]{64})$/i.exec(record.deploymentId);
  if (match === null) return null;
  const buildNumber = match[1];
  const revision = match[2];
  if (buildNumber === undefined || buildNumber.length === 0 || revision === undefined) return null;
  const desired = record.plan.changes.find((change) => change.target === 'ios')?.desired;
  if (desired?.target !== 'ios') return null;
  return {
    revision,
    buildNumber,
    bundleIdentifier: desired.bundleIdentifier,
    recordedAt: record.recordedAt,
  };
}

function matchesRequestedBundle(item: IosHistoryEvidence, bundleIdentifier: string | undefined) {
  return bundleIdentifier === undefined || item.bundleIdentifier === bundleIdentifier;
}

function matchesRemoteBuild(
  item: IosHistoryEvidence,
  state: AppStoreConnectIosState | null | undefined,
) {
  if (state === undefined) return true;
  if (state === null || state.bundleIdentifier !== item.bundleIdentifier) return false;
  const build = state.version?.build;
  if (build === null || build === undefined || build.buildNumber !== item.buildNumber) return false;
  return build.processingState === undefined || build.processingState === 'VALID';
}

function observed(item: IosHistoryEvidence): DeploymentObservedIosTarget {
  return {
    bundleIdentifier: item.bundleIdentifier,
    providers: { build: 'eas', publish: 'app-store-connect' },
    revision: item.revision,
  };
}
