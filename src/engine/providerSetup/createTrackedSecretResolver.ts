import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';

export interface TrackedSecretResolver {
  readonly resolve: DeploymentSecretResolver;
  readonly secrets: ReadonlySet<string>;
}

export function createTrackedSecretResolver(
  resolveSecret: DeploymentSecretResolver,
): TrackedSecretResolver {
  const secrets = new Set<string>();
  return {
    secrets,
    resolve: async (reference) => {
      const secret = await resolveSecret(reference);
      if (secret !== null && secret.length > 0) secrets.add(secret);
      return secret;
    },
  };
}
