import type { DeploymentProviderSetupInspectionResult } from '../../domain/DeploymentProviderSetupInspectionResult';
import { inspectDeploymentProviderSetup } from '../../engine/inspectDeploymentProviderSetup';
import { createEasSetupAdapter } from '../../providers/eas/createEasSetupAdapter';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import type { ResolvedProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';

export function inspectProjectAndroidEasSetup(
  projectRoot: string,
  access: ResolvedProjectAndroidDeploymentAccess,
  runtime: ProjectAndroidDeploymentRuntime,
): Promise<DeploymentProviderSetupInspectionResult> {
  return inspectDeploymentProviderSetup({
    adapter: createEasSetupAdapter({
      projectRoot,
      runProcess: runtime.runProcess,
      target: 'android',
      capability: 'build',
    }),
    context: { target: 'android', ...access },
  });
}
