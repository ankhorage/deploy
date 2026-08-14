import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import type { ProjectReleaseMutationContext } from './ProjectReleaseMutationContext';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';

export function publishProjectReleaseTarget(options: {
  readonly step: ReleasePlanStep;
  readonly context: ProjectReleaseMutationContext;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseMutationResult> {
  const publish = {
    projectRoot: options.context.projectRoot,
    desired: options.context.desired,
    targets: options.context.targets,
    access: options.context.access,
  };
  if (options.step.target === 'web') return options.runtime.publishWeb(publish);
  if (options.step.target === 'android') return options.runtime.publishAndroid(publish);
  if (options.step.target === 'ios') return options.runtime.publishIos(publish);
  return Promise.resolve({ status: 'failed', code: 'PROJECT_RELEASE_PUBLISH_TARGET_INVALID' });
}
