import type { IosDeploymentPublication } from '../../domain/IosDeploymentPublication';
import type { AppStoreConnectIosState } from '../../providers/appStoreConnect/AppStoreConnectIosState';
import { listProjectDeploymentHistory } from '../history/listProjectDeploymentHistory';
import type { ProjectDeploymentHistoryRecord } from '../history/ProjectDeploymentHistoryRecord';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';

type IosArtifact = Pick<IosDeploymentPublication, 'revision' | 'version' | 'buildNumber'>;

interface IosEvidence {
  readonly revision: string;
  readonly buildNumber: string;
  readonly bundleIdentifier: string;
  readonly recordedAt: string;
}

export async function readProjectReleaseIosArtifact(options: {
  readonly projectRoot: string;
  readonly version: string;
  readonly target: NonNullable<ProjectReleaseTargets['ios']>;
  readonly appStoreState: AppStoreConnectIosState;
}): Promise<IosArtifact | null> {
  const build = options.appStoreState.version?.build;
  if (build === null || build === undefined) return null;
  if (build.processingState !== undefined && build.processingState !== 'VALID') return null;
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const [evidence] = history
    .map(parseEvidence)
    .filter((item): item is IosEvidence => item !== null)
    .filter((item) => item.bundleIdentifier === options.target.bundleIdentifier)
    .filter((item) => item.buildNumber === build.buildNumber)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  return evidence === undefined
    ? null
    : {
        revision: evidence.revision,
        version: options.version,
        buildNumber: evidence.buildNumber,
      };
}

function parseEvidence(record: ProjectDeploymentHistoryRecord): IosEvidence | null {
  if (record.execution.status !== 'completed' || record.verification?.ok !== true) return null;
  const match = /^ios-(.+)-([a-f\d]{64})$/i.exec(record.deploymentId);
  if (match === null) return null;
  const [, buildNumber, revision] = match;
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
