import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleaseObservedTargetState } from '../../domain/release/ReleaseObservedTargetState';
import { inspectProjectReleaseAndroid } from './inspectProjectReleaseAndroid';
import { inspectProjectReleaseIos } from './inspectProjectReleaseIos';
import { inspectProjectReleaseWeb } from './inspectProjectReleaseWeb';
import type { ProjectReleaseObservedResult } from './ProjectReleaseObservedResult';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

export async function inspectProjectReleaseObserved(options: {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
  readonly targets: ProjectReleaseTargets;
  readonly access: ResolvedProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ProjectReleaseObservedResult> {
  const states: ReleaseObservedTargetState[] = [];
  const actions: Extract<ProjectReleaseObservedResult, { readonly ok: true }>['actions'][number][] =
    [];
  if (options.targets.web !== undefined) {
    const result = await inspectProjectReleaseWeb(options);
    if (!result.ok) return result;
    states.push(result.state);
    actions.push(...result.actions);
  }
  if (options.targets.android !== undefined) {
    const result = await inspectProjectReleaseAndroid({
      ...options,
      target: options.targets.android,
    });
    if (!result.ok) return result;
    states.push(result.state);
    actions.push(...result.actions);
  }
  if (options.targets.ios !== undefined) {
    const result = await inspectProjectReleaseIos({
      ...options,
      target: options.targets.ios,
    });
    if (!result.ok) return result;
    states.push(result.state);
    actions.push(...result.actions);
  }
  return { ok: true, observed: { targets: states }, actions };
}
