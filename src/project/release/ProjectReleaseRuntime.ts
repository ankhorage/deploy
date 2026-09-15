import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';
import type { publishProjectReleaseAndroid } from './publishProjectReleaseAndroid';
import type { publishProjectReleaseIos } from './publishProjectReleaseIos';
import type { publishProjectReleaseWeb } from './publishProjectReleaseWeb';

export interface ProjectReleaseRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly publishWeb: typeof publishProjectReleaseWeb;
  readonly publishAndroid: typeof publishProjectReleaseAndroid;
  readonly publishIos: typeof publishProjectReleaseIos;
  readonly now: () => Date;
}
