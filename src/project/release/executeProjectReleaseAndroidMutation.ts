import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { resolveRegisteredReleaseAdapter } from '../../features/release-management/adapters/inbound/resolveRegisteredReleaseAdapter.js';
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
  const adapter = resolveRegisteredReleaseAdapter({
    providers: options.runtime.providers,
    providerId: target.provider,
    target: 'android',
  });
  if (adapter === undefined) return failed('PROJECT_RELEASE_ANDROID_PROVIDER_UNAVAILABLE');
  const inspection = await adapter.inspectAsync({
    identity: { target: 'android', packageName: target.packageName },
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    version: options.context.desired.version,
  });
  if (inspection.status === 'action-required') return blocked(inspection.action.code);
  if (inspection.status === 'failed') return failed(inspection.failure.code);
  if (inspection.value.target !== 'android') {
    return failed('PROJECT_RELEASE_ANDROID_PROVIDER_INVALID');
  }
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: options.context.projectRoot,
    target,
    observed: inspection.value,
  });
  if (publication === null) return failed('PROJECT_RELEASE_ANDROID_ARTIFACT_REQUIRED');
  return adapter.executeStepAsync({
    identity: { target: 'android', packageName: target.packageName },
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    desired: options.context.desired,
    step: options.step,
  });
}

function blocked(code: string): ReleaseMutationResult {
  return { status: 'blocked', code };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
