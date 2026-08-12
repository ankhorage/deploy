import type { DeploymentHttpProbe } from './DeploymentHttpProbe';

export const probeDeploymentHttp: DeploymentHttpProbe = async (url) => {
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  return { status: response.status };
};
