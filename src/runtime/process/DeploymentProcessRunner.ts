export interface DeploymentProcessRequest {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
}

export interface DeploymentProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

export type DeploymentProcessRunner = (
  request: DeploymentProcessRequest,
) => Promise<DeploymentProcessResult>;
