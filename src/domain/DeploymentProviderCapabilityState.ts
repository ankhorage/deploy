import type { DeploymentCapability } from './DeploymentCapability';

export interface DeploymentProviderCapabilityState {
  readonly capability: DeploymentCapability;
  readonly status: 'available' | 'unavailable';
  readonly reason?: string;
}
