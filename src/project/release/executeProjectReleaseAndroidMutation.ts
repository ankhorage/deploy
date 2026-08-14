import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { inspectGooglePlayReleaseState } from '../../providers/googlePlay/inspectGooglePlayReleaseState';
import type { ProjectReleaseMutationContext } from './ProjectReleaseMutationContext';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { readProjectReleaseAndroidArtifact } from './readProjectReleaseAndroidArtifact';

export async function executeProjectReleaseAndroidMutation(options: {
  readonly step: ReleasePlanStep;
  readonly context: ProjectReleaseMutationContext;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseMutationResult> {
  const target = options.context.targets.android;
  if (target === undefined) return failed('PROJECT_RELEASE_ANDROID_TARGET_REQUIRED');
  const inspected = await inspectGooglePlayReleaseState({
    packageName: target.packageName,
    track: target.track,
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  if (inspected.status === 'action-required') {
    return { status: 'blocked', code: inspected.action.code };
  }
  if (inspected.status === 'failed') return failed(inspected.failure.code);
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: options.context.projectRoot,
    target,
    snapshot: inspected.state,
  });
  if (publication === null) return failed('PROJECT_RELEASE_ANDROID_ARTIFACT_REQUIRED');
  return options.runtime.executeGooglePlayMutation({
    step: options.step,
    desired: options.context.desired,
    packageName: target.packageName,
    track: target.track,
    versionCode: String(publication.versionCode),
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
