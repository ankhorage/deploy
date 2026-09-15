import type { ReleaseObservedAndroidState } from '@ankhorage/contracts/deploy-provider';

import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import { listProjectDeploymentHistory } from '../history/listProjectDeploymentHistory';
import type { ProjectDeploymentHistoryRecord } from '../history/ProjectDeploymentHistoryRecord';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';

type AndroidArtifact = Pick<AndroidDeploymentPublication, 'revision' | 'versionCode' | 'track'>;

interface AndroidEvidence {
  readonly revision: string;
  readonly versionCode: number;
  readonly packageName: string;
  readonly recordedAt: string;
}

export async function readProjectReleaseAndroidArtifact(options: {
  readonly projectRoot: string;
  readonly target: NonNullable<ProjectReleaseTargets['android']>;
  readonly observed: ReleaseObservedAndroidState;
}): Promise<AndroidArtifact | null> {
  const history = await listProjectDeploymentHistory({ projectRoot: options.projectRoot });
  const [evidence] = history
    .map(parseEvidence)
    .filter((item): item is AndroidEvidence => item !== null)
    .filter((item) => item.packageName === options.target.packageName)
    .filter((item) => options.observed.versionCodes.includes(String(item.versionCode)))
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  return evidence === undefined
    ? null
    : {
        revision: evidence.revision,
        versionCode: evidence.versionCode,
        track: options.target.track,
      };
}

function parseEvidence(record: ProjectDeploymentHistoryRecord): AndroidEvidence | null {
  if (record.execution.status !== 'completed' || record.verification?.ok !== true) return null;
  const match = /^android-(\d+)-([a-f\d]{64})$/i.exec(record.deploymentId);
  if (match === null) return null;
  const [, versionCodeValue, revision] = match;
  const versionCode = Number(versionCodeValue);
  if (!Number.isSafeInteger(versionCode) || versionCode <= 0 || revision === undefined) return null;
  const desired = record.plan.changes.find((change) => change.target === 'android')?.desired;
  if (desired?.target !== 'android') return null;
  return {
    revision,
    versionCode,
    packageName: desired.package,
    recordedAt: record.recordedAt,
  };
}
