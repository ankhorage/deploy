import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { publishProjectReleaseAndroid } from './publishProjectReleaseAndroid';
import { publishProjectReleaseIos } from './publishProjectReleaseIos';
import { publishProjectReleaseWeb } from './publishProjectReleaseWeb';

export const defaultProjectReleaseRuntime: ProjectReleaseRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  publishWeb: publishProjectReleaseWeb,
  publishAndroid: publishProjectReleaseAndroid,
  publishIos: publishProjectReleaseIos,
  now: () => new Date(),
};
