import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createEasSetupAdapter } from '../../providers/eas/createEasSetupAdapter';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import type { ResolvedProjectWebDeploymentAccess } from './resolveProjectWebDeploymentAccess';

export function inspectProjectWebSetup(
  projectRoot: string,
  access: ResolvedProjectWebDeploymentAccess,
  runtime: ProjectWebDeploymentRuntime,
): Promise<DeploymentProviderSetupInspectionResult> {
  return inspectDeploymentProviderSetup({
    adapter: createEasSetupAdapter({
      projectRoot,
      runProcess: runtime.runProcess,
      target: 'web',
      capability: 'publish',
    }),
    context: { target: 'web', ...access },
  });
}
