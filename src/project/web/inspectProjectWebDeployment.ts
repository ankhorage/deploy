import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentCurrentState } from '../../domain/DeploymentCurrentState';
import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { cleanupWebArtifact, prepareWebArtifact } from '../../targets/web/prepareWebArtifact';
import { resolveDeployProject } from '../resolveDeployProject';
import { inspectProjectWebSetup } from './inspectProjectWebSetup';
import { normalizeProjectWebDesired } from './normalizeProjectWebDesired';
import type { ProjectWebDeploymentAccess } from './ProjectWebDeploymentAccess';
import type { ProjectWebDeploymentInspectionResult } from './ProjectWebDeploymentInspection';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import { projectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import { readCurrentProjectWebDeployment } from './readCurrentProjectWebDeployment';
import { resolveProjectWebDeploymentAccess } from './resolveProjectWebDeploymentAccess';

export interface InspectProjectWebDeploymentOptions extends ProjectWebDeploymentAccess {
  readonly projectRoot: string;
}

export function inspectProjectWebDeployment(
  options: InspectProjectWebDeploymentOptions,
): Promise<ProjectWebDeploymentInspectionResult> {
  return inspectProjectWebDeploymentWithRuntime(options, projectWebDeploymentRuntime);
}

export async function inspectProjectWebDeploymentWithRuntime(
  options: InspectProjectWebDeploymentOptions,
  runtime: ProjectWebDeploymentRuntime,
): Promise<ProjectWebDeploymentInspectionResult> {
  try {
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const normalized = normalizeProjectWebDesired(project.deploy);
    if (!normalized.ok) return normalized;
    const current = await readCurrentProjectWebDeployment(project.projectRoot);
    if (!normalized.enabled) {
      return success(project.projectRoot, normalized.desired, current, undefined, null);
    }
    const artifact = await prepareWebArtifact({
      projectRoot: project.projectRoot,
      runProcess: runtime.runProcess,
    });
    if (!artifact.ok) return artifact;
    const { directory, revision } = artifact.artifact;
    await cleanupWebArtifact(directory);
    const access = resolveProjectWebDeploymentAccess(options);
    const setup = await inspectProjectWebSetup(project.projectRoot, access, runtime);
    return success(project.projectRoot, normalized.desired, current, revision, setup);
  } catch {
    return {
      ok: false,
      failure: {
        code: 'WEB_PROJECT_INSPECTION_FAILED',
        message: 'Web deployment project inspection failed.',
        target: 'web',
      },
    };
  }
}

function success(
  projectRoot: string,
  desired: AppDeployManifest,
  current: DeploymentCurrentState,
  desiredRevision: string | undefined,
  setup: DeploymentProviderSetupInspectionResult | null,
): ProjectWebDeploymentInspectionResult {
  return {
    ok: true,
    inspection: {
      projectRoot,
      desired,
      current,
      ...(desiredRevision === undefined ? {} : { desiredRevision }),
      setup,
    },
  };
}
