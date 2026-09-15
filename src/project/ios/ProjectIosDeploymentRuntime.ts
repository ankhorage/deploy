import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';

export interface ProjectIosDeploymentRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly now: () => Date;
}

export const projectIosDeploymentRuntime: ProjectIosDeploymentRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  now: () => new Date(),
};
