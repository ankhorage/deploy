export interface WebDeploymentPublication {
  readonly target: 'web';
  readonly revision: string;
  readonly provider: string;
  readonly deploymentId: string;
  readonly url: string;
  readonly production: boolean;
}
