export interface WebDeploymentPublishIntent {
  readonly mode: 'preview' | 'production';
  readonly alias?: string;
  readonly environment?: string;
}
