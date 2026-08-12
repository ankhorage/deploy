import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createEasHostingSetupAdapter } from '../../providers/eas/createEasHostingSetupAdapter';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import type { ResolvedProjectWebDeploymentAccess } from './resolveProjectWebDeploymentAccess';

export function inspectProjectWebSetup(
  projectRoot: string,
  access: ResolvedProjectWebDeploymentAccess,
  runtime: ProjectWebDeploymentRuntime,
): Promise<DeploymentProviderSetupInspectionResult> {
  return inspectDeploymentProviderSetup({
    adapter: createEasHostingSetupAdapter({ projectRoot, runProcess: runtime.runProcess }),
    context: { target: 'web', ...access },
  });
}
