import type { AppDeployProviderSelection } from '@ankhorage/contracts/deploy';
import type { IosPublishInspection } from '@ankhorage/contracts/deploy-provider';

import type {
  DeploymentCurrentState,
  DeploymentObservedIosTarget,
} from '../../domain/DeploymentCurrentState';
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
  readonly providers?: AppDeployProviderSelection;
  readonly publishInspection?: IosPublishInspection | null;
}): Promise<DeploymentCurrentState> {
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const evidence = history
    .map(parseEvidence)
    .filter((item): item is IosHistoryEvidence => item !== null)
    .filter((item) => matchesRequestedBundle(item, options.bundleIdentifier))
    .filter((item) => matchesRemoteBuild(item, options.publishInspection))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))[0];
  return evidence === undefined
    ? { targets: {} }
    : { targets: { ios: observed(evidence, options.providers) } };
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
  inspection: IosPublishInspection | null | undefined,
) {
  if (inspection === undefined) return true;
  if (inspection === null || inspection.bundleIdentifier !== item.bundleIdentifier) return false;
  return inspection.buildNumber === item.buildNumber;
}

function observed(
  item: IosHistoryEvidence,
  providers: AppDeployProviderSelection | undefined,
): DeploymentObservedIosTarget {
  return {
    bundleIdentifier: item.bundleIdentifier,
    ...(providers === undefined ? {} : { providers }),
    revision: item.revision,
  };
}
