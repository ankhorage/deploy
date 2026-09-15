import type { ReleaseControlExecutionResult } from '@ankhorage/contracts/deploy-provider';

import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { resolveRegisteredReleaseAdapter } from '../../features/release-management/adapters/inbound/resolveRegisteredReleaseAdapter.js';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ProjectReleaseMutationContext } from './ProjectReleaseMutationContext';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import { readProjectReleaseAndroidArtifact } from './readProjectReleaseAndroidArtifact';
import { resolveProjectReleaseMutationContext } from './resolveProjectReleaseMutationContext';

export async function executeProjectReleaseControlMutation(options: {
  readonly control: ReleaseLifecycleControl;
  readonly projectRoot: string;
  readonly expectedRevision: string;
  readonly access: ProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseMutationResult> {
  const resolved = await resolveProjectReleaseMutationContext(options);
  if (!resolved.ok) return resolved.mutation;
  return options.control.target === 'android'
    ? executeAndroidControl(options, resolved.context, options.control)
    : executeIosControl(options, resolved.context, options.control);
}

async function executeAndroidControl(
  options: Parameters<typeof executeProjectReleaseControlMutation>[0],
  context: ProjectReleaseMutationContext,
  control: Extract<ReleaseLifecycleControl, { readonly target: 'android' }>,
): Promise<ReleaseMutationResult> {
  const target = context.targets.android;
  if (target === undefined) return failed('PROJECT_RELEASE_ANDROID_TARGET_REQUIRED');
  const adapter = resolveRegisteredReleaseAdapter({
    providers: options.runtime.providers,
    providerId: target.provider,
    target: 'android',
  });
  if (adapter === undefined) return failed('PROJECT_RELEASE_ANDROID_PROVIDER_UNAVAILABLE');
  const inspected = await adapter.inspectAsync({
    identity: { target: 'android', packageName: target.packageName },
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    version: context.desired.version,
  });
  if (inspected.status === 'action-required') return blocked(inspected.action.code);
  if (inspected.status === 'failed') return failed(inspected.failure.code);
  if (inspected.value.target !== 'android') {
    return failed('PROJECT_RELEASE_ANDROID_PROVIDER_INVALID');
  }
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: context.projectRoot,
    target,
    observed: inspected.value,
  });
  if (publication === null) return failed('PROJECT_RELEASE_ANDROID_ARTIFACT_REQUIRED');
  const result = await adapter.controlAsync({
    identity: { target: 'android', packageName: target.packageName },
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    desired: context.desired,
    control,
  });
  return mapControlResult(result);
}

async function executeIosControl(
  options: Parameters<typeof executeProjectReleaseControlMutation>[0],
  context: ProjectReleaseMutationContext,
  control: Extract<ReleaseLifecycleControl, { readonly target: 'ios' }>,
): Promise<ReleaseMutationResult> {
  const target = context.targets.ios;
  if (target === undefined) return failed('PROJECT_RELEASE_IOS_TARGET_REQUIRED');
  const adapter = resolveRegisteredReleaseAdapter({
    providers: options.runtime.providers,
    providerId: target.provider,
    target: 'ios',
  });
  if (adapter === undefined) return failed('PROJECT_RELEASE_IOS_PROVIDER_UNAVAILABLE');
  const result = await adapter.controlAsync({
    identity: { target: 'ios', bundleIdentifier: target.bundleIdentifier },
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    desired: context.desired,
    control,
  });
  return mapControlResult(result);
}

function mapControlResult(result: ReleaseControlExecutionResult): ReleaseMutationResult {
  switch (result.status) {
    case 'completed':
      return { status: 'completed' };
    case 'blocked':
      return blocked(result.code);
    case 'failed':
      return failed(result.code);
  }
}

function blocked(code: string): ReleaseMutationResult {
  return { status: 'blocked', code };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
