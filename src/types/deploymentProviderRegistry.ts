import type { DeploymentProviderRegistration } from '@ankhorage/contracts/deploy-provider';

/*** Registered deployment providers available to Deploy orchestration. */
export type DeploymentProviderRegistry = readonly DeploymentProviderRegistration[];
