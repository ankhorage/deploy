import { defaultProjectMonetizationRuntime } from './defaultProjectMonetizationRuntime';
import type { InspectProjectMonetizationOptions } from './InspectProjectMonetizationOptions';
import { inspectProjectMonetizationWithRuntime } from './inspectProjectMonetizationWithRuntime';
import type { ProjectMonetizationInspectionResult } from './ProjectMonetizationInspectionResult';

export function inspectProjectMonetization(
  options: InspectProjectMonetizationOptions,
): Promise<ProjectMonetizationInspectionResult> {
  return inspectProjectMonetizationWithRuntime(options, defaultProjectMonetizationRuntime);
}
