import { defaultProjectReleaseRuntime } from './defaultProjectReleaseRuntime';
import type { InspectProjectReleaseOptions } from './InspectProjectReleaseOptions';
import { inspectProjectReleaseWithRuntime } from './inspectProjectReleaseWithRuntime';
import type { ProjectReleaseInspectionResult } from './ProjectReleaseInspectionResult';

export function inspectProjectRelease(
  options: InspectProjectReleaseOptions,
): Promise<ProjectReleaseInspectionResult> {
  return inspectProjectReleaseWithRuntime(options, defaultProjectReleaseRuntime);
}
