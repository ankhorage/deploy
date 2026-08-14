import type { DeploymentFailure, ReleasePlan } from '../index.js';
import type { ProjectReleaseAccess, ProjectReleaseInspection } from '../project/index.js';
import { createDeployCliAccess } from './createDeployCliAccess.js';
import type { DeployCliOptions } from './DeployCliOptions.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';

type InspectionResult =
  | {
      readonly ok: true;
      readonly access: ProjectReleaseAccess;
      readonly inspection: ProjectReleaseInspection;
      readonly plan: ReleasePlan;
    }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export async function inspectDeployCliRelease(
  options: DeployCliOptions,
  env: Readonly<Record<string, string | undefined>>,
  runtime: DeployCliRuntime,
): Promise<InspectionResult> {
  const access = createDeployCliAccess(options, env);
  const result = await runtime.inspectProjectRelease({
    projectRoot: options.projectRoot,
    ...access,
  });
  if (!result.ok) return result;
  return {
    ok: true,
    access,
    inspection: result.inspection,
    plan: runtime.createProjectReleasePlan(result.inspection),
  };
}
