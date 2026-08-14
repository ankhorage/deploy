import type { AndroidDeploymentTrack } from '../index.js';

export interface DeployCliOptions {
  readonly projectRoot: string;
  readonly dryRun: boolean;
  readonly yes: boolean;
  readonly format: 'human' | 'json';
  readonly executionId?: string;
  readonly androidTrack?: AndroidDeploymentTrack;
  readonly androidBuildProfile?: string;
  readonly iosBuildProfile?: string;
  readonly webAlias?: string;
  readonly webEnvironment?: string;
}
