import type { ResolvedProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';

export function scopeProjectAndroidDeploymentAccess(
  access: ResolvedProjectAndroidDeploymentAccess,
  provider: 'eas' | 'google-play',
): ResolvedProjectAndroidDeploymentAccess {
  return {
    credentials: access.credentials.filter((credential) => credential.provider === provider),
    resolveSecret: access.resolveSecret,
  };
}
