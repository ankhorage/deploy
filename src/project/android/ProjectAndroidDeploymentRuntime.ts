import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';

export interface ProjectAndroidDeploymentRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly now: () => Date;
}

export const projectAndroidDeploymentRuntime: ProjectAndroidDeploymentRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  now: () => new Date(),
};
