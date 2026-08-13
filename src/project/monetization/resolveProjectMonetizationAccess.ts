import type { ProjectMonetizationAccess } from './ProjectMonetizationAccess';
import type { ResolvedProjectMonetizationAccess } from './ResolvedProjectMonetizationAccess';

export function resolveProjectMonetizationAccess(
  access: ProjectMonetizationAccess,
): ResolvedProjectMonetizationAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
  };
}
