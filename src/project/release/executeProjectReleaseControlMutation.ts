import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { inspectAppStoreReleaseState } from '../../providers/appStoreConnect/inspectAppStoreReleaseState';
import { inspectGooglePlayReleaseState } from '../../providers/googlePlay/inspectGooglePlayReleaseState';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
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
  if (options.control.target === 'android') {
    return executeAndroidControl(options, resolved.context, options.control);
  }
  return executeIosControl(options, resolved.context, options.control);
}

async function executeAndroidControl(
  options: Parameters<typeof executeProjectReleaseControlMutation>[0],
  context: Extract<
    Awaited<ReturnType<typeof resolveProjectReleaseMutationContext>>,
    { ok: true }
  >['context'],

  control: Extract<ReleaseLifecycleControl, { readonly target: 'android' }>,
): Promise<ReleaseMutationResult> {
  const target = context.targets.android;
  if (target === undefined) return failed('PROJECT_RELEASE_ANDROID_TARGET_REQUIRED');
  const inspected = await inspectGooglePlayReleaseState({
    packageName: target.packageName,
    track: target.track,
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  if (inspected.status === 'action-required') return blocked(inspected.action.code);
  if (inspected.status === 'failed') return failed(inspected.failure.code);
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: context.projectRoot,
    target,
    snapshot: inspected.state,
  });
  if (publication === null) return failed('PROJECT_RELEASE_ANDROID_ARTIFACT_REQUIRED');
  return options.runtime.executeGooglePlayControl({
    control,
    packageName: target.packageName,
    track: target.track,
    versionCode: String(publication.versionCode),
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
}

async function executeIosControl(
  options: Parameters<typeof executeProjectReleaseControlMutation>[0],
  context: Extract<
    Awaited<ReturnType<typeof resolveProjectReleaseMutationContext>>,
    { ok: true }
  >['context'],

  control: Extract<ReleaseLifecycleControl, { readonly target: 'ios' }>,
): Promise<ReleaseMutationResult> {
  const target = context.targets.ios;
  if (target === undefined) return failed('PROJECT_RELEASE_IOS_TARGET_REQUIRED');
  const inspected = await inspectAppStoreReleaseState({
    bundleIdentifier: target.bundleIdentifier,
    version: context.desired.version,
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (inspected.status === 'action-required') return blocked(inspected.action.code);
  if (inspected.status === 'failed') return failed(inspected.failure.code);
  return options.runtime.executeAppStoreControl({
    control,
    snapshot: inspected.state,
    credentials: context.access.credentials,
    resolveSecret: context.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
}

function blocked(code: string): ReleaseMutationResult {
  return { status: 'blocked', code };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
