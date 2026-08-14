import { createDeployCliAccess } from './createDeployCliAccess.js';
import type { DeployCliInspectionResult } from './DeployCliInspectionResult.js';
import type { DeployCliOptions } from './DeployCliOptions.js';
import type { DeployCliRuntime } from './DeployCliRuntime.js';

export async function inspectDeployCliRelease(
  options: DeployCliOptions,
  env: Readonly<Record<string, string | undefined>>,
  runtime: DeployCliRuntime,
): Promise<DeployCliInspectionResult> {
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
