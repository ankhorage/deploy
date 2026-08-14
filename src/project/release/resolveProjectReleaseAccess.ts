import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

export function resolveProjectReleaseAccess(
  access: ProjectReleaseAccess,
): ResolvedProjectReleaseAccess {
  return {
    credentials: access.credentials ?? [],
    resolveSecret: access.resolveSecret ?? (() => Promise.resolve(null)),
    ...(access.android === undefined ? {} : { android: access.android }),
    ...(access.ios === undefined ? {} : { ios: access.ios }),
    ...(access.web === undefined ? {} : { web: access.web }),
  };
}
