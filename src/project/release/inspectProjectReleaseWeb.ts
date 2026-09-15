import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { createWebReleaseObservation } from '../../features/release-management/utils/createWebReleaseObservation.js';
import { readCurrentProjectWebProductionDeployment } from '../web/readCurrentProjectWebProductionDeployment';
import type { ProjectReleaseTargetInspection } from './ProjectReleaseTargetInspection';

export async function inspectProjectReleaseWeb(options: {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
}): Promise<ProjectReleaseTargetInspection> {
  const current = await readCurrentProjectWebProductionDeployment(options.projectRoot);
  const revision = current.targets.web?.revision;
  return {
    ok: true,
    state: createWebReleaseObservation(
      options.desired.version,
      revision === undefined ? null : { revision },
    ),
    actions: [],
  };
}
