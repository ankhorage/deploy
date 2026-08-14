import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { executeProjectReleaseAndroidMutation } from './executeProjectReleaseAndroidMutation';
import { executeProjectReleaseIosMutation } from './executeProjectReleaseIosMutation';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { publishProjectReleaseTarget } from './publishProjectReleaseTarget';
import { resolveProjectReleaseMutationContext } from './resolveProjectReleaseMutationContext';

export async function executeProjectReleaseMutation(options: {
  readonly step: ReleasePlanStep;
  readonly projectRoot: string;
  readonly expectedRevision: string;
  readonly access: ProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseMutationResult> {
  const resolved = await resolveProjectReleaseMutationContext(options);
  if (!resolved.ok) return resolved.mutation;
  if (options.step.operation === 'publish') {
    return publishProjectReleaseTarget({
      step: options.step,
      context: resolved.context,
      runtime: options.runtime,
    });
  }
  if (options.step.target === 'android') {
    return executeProjectReleaseAndroidMutation({
      step: options.step,
      context: resolved.context,
      runtime: options.runtime,
    });
  }
  if (options.step.target === 'ios') {
    return executeProjectReleaseIosMutation({
      step: options.step,
      context: resolved.context,
      runtime: options.runtime,
    });
  }
  return { status: 'failed', code: 'PROJECT_RELEASE_STEP_UNSUPPORTED' };
}
