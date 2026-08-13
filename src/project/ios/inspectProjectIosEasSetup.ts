import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createEasSetupAdapter } from '../../providers/eas/createEasSetupAdapter';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import type { ResolvedProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';
import { scopeProjectIosDeploymentAccess } from './scopeProjectIosDeploymentAccess';

export function inspectProjectIosEasSetup(
  projectRoot: string,
  access: ResolvedProjectIosDeploymentAccess,
  runtime: ProjectIosDeploymentRuntime,
): Promise<DeploymentProviderSetupInspectionResult> {
  return inspectDeploymentProviderSetup({
    adapter: createEasSetupAdapter({
      projectRoot,
      runProcess: runtime.runProcess,
      target: 'ios',
      capability: 'build',
    }),
    context: {
      target: 'ios',
      ...scopeProjectIosDeploymentAccess(access, 'eas'),
    },
  });
}
