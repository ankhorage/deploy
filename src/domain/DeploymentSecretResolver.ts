import type { DeploymentCredentialReference } from './DeploymentCredentialReference';

export type DeploymentSecretMaterial = string;

export type DeploymentSecretResolver = (
  reference: DeploymentCredentialReference,
) => Promise<DeploymentSecretMaterial | null>;
