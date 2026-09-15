import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { ProjectMonetizationRuntime } from './ProjectMonetizationRuntime';

export const defaultProjectMonetizationRuntime: ProjectMonetizationRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  now: () => new Date(),
};
