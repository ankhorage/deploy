import type { DeploymentHttpProbe } from '../../runtime/http/DeploymentHttpProbe';
import { probeDeploymentHttp } from '../../runtime/http/probeDeploymentHttp';
import type { DeploymentProcessRunner } from '../../runtime/process/DeploymentProcessRunner';
import { runDeploymentProcess } from '../../runtime/process/runDeploymentProcess';

export interface ProjectWebDeploymentRuntime {
  readonly runProcess: DeploymentProcessRunner;
  readonly probeHttp: DeploymentHttpProbe;
  readonly now: () => Date;
}

export const projectWebDeploymentRuntime: ProjectWebDeploymentRuntime = {
  runProcess: runDeploymentProcess,
  probeHttp: probeDeploymentHttp,
  now: () => new Date(),
};
