import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { DeploymentHttpProbe } from '../../runtime/http/DeploymentHttpProbe';
import { probeDeploymentHttp } from '../../runtime/http/probeDeploymentHttp';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { runDeploymentProcess } from '../../runtime/process/runDeploymentProcess';
import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';

export interface ProjectWebDeploymentRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly runProcess: DeploymentProcessRunner;
  readonly probeHttp: DeploymentHttpProbe;
  readonly now: () => Date;
}

export const projectWebDeploymentRuntime: ProjectWebDeploymentRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  runProcess: runDeploymentProcess,
  probeHttp: probeDeploymentHttp,
  now: () => new Date(),
};
