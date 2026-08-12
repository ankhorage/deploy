interface DeploymentHttpProbeResult {
  readonly status: number;
}

export type DeploymentHttpProbe = (url: string) => Promise<DeploymentHttpProbeResult>;
