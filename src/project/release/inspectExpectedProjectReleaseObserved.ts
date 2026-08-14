import type { ReleaseObservedState } from '../../domain/release/ReleaseObservedState';
import { inspectProjectReleaseWithRuntime } from './inspectProjectReleaseWithRuntime';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';

export async function inspectExpectedProjectReleaseObserved(options: {
  readonly projectRoot: string;
  readonly expectedRevision: string;
  readonly access: ProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseObservedState | null> {
  const inspected = await inspectProjectReleaseWithRuntime(
    { projectRoot: options.projectRoot, ...options.access },
    options.runtime,
  );
  if (!inspected.ok || inspected.inspection.desired.revision !== options.expectedRevision) {
    return null;
  }
  return inspected.inspection.observed;
}
