import { createReleaseCurrentRevision } from '../../domain/release/createReleaseCurrentRevision';
import { resolveDeployProject } from '../resolveDeployProject';
import { inspectProjectReleaseObserved } from './inspectProjectReleaseObserved';
import type { InspectProjectReleaseOptions } from './InspectProjectReleaseOptions';
import type { ProjectReleaseInspectionResult } from './ProjectReleaseInspectionResult';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { readProjectRelease } from './readProjectRelease';
import { resolveProjectReleaseAccess } from './resolveProjectReleaseAccess';
import { resolveProjectReleaseTargets } from './resolveProjectReleaseTargets';

export async function inspectProjectReleaseWithRuntime(
  options: InspectProjectReleaseOptions,
  runtime: ProjectReleaseRuntime,
): Promise<ProjectReleaseInspectionResult> {
  try {
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const desired = await readProjectRelease({ projectRoot: project.projectRoot });
    const access = resolveProjectReleaseAccess(options);
    const targets = resolveProjectReleaseTargets(project.deploy, desired, access);
    if (!targets.ok) return targets;
    const observed = await inspectProjectReleaseObserved({
      projectRoot: project.projectRoot,
      desired,
      targets: targets.targets,
      access,
      runtime,
    });
    if (!observed.ok) return observed;
    return {
      ok: true,
      inspection: {
        projectRoot: project.projectRoot,
        desired,
        observed: observed.observed,
        currentRevision: createReleaseCurrentRevision(observed.observed, desired.targets),
        actions: observed.actions,
      },
    };
  } catch {
    return failure();
  }
}

function failure(): ProjectReleaseInspectionResult {
  return {
    ok: false,
    failure: {
      code: 'PROJECT_RELEASE_INSPECTION_FAILED',
      message: 'Project release inspection failed.',
    },
  };
}
