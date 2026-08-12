import type { ResolvedProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';

export function scopeProjectIosDeploymentAccess(
  access: ResolvedProjectIosDeploymentAccess,
  provider: 'eas' | 'app-store-connect',
): ResolvedProjectIosDeploymentAccess {
  return {
    credentials: access.credentials.filter((credential) => credential.provider === provider),
    resolveSecret: access.resolveSecret,
  };
}
