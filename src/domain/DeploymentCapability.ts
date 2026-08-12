export const DEPLOYMENT_CAPABILITIES = [
  'provision',
  'prepare',
  'build',
  'publish',
  'verify',
] as const;

export type DeploymentCapability = (typeof DEPLOYMENT_CAPABILITIES)[number];
