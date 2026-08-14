import type {
  DeploymentCurrentState,
  DeploymentObservedWebTarget,
} from '../../domain/DeploymentCurrentState';
import { listProjectDeploymentHistory } from '../history/listProjectDeploymentHistory';
import type { ProjectDeploymentHistoryRecord } from '../history/ProjectDeploymentHistoryRecord';

export async function readCurrentProjectWebProductionDeployment(
  projectRoot: string,
): Promise<DeploymentCurrentState> {
  const history = await listProjectDeploymentHistory({ projectRoot });
  const [record] = [...history]
    .filter(isSuccessfulProductionRecord)
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt));
  const web = record === undefined ? null : observedWebTarget(record);
  return { targets: web === null ? {} : { web } };
}

function isSuccessfulProductionRecord(record: ProjectDeploymentHistoryRecord): boolean {
  return (
    record.deploymentId.startsWith('web-production-') &&
    record.execution.status === 'completed' &&
    record.verification?.ok === true
  );
}

function observedWebTarget(
  record: ProjectDeploymentHistoryRecord,
): DeploymentObservedWebTarget | null {
  const desired = record.plan.changes.find((change) => change.target === 'web')?.desired;
  if (desired?.target !== 'web' || desired.revision === undefined) return null;
  return {
    revision: desired.revision,
    ...(desired.providers === undefined ? {} : { providers: desired.providers }),
  };
}
