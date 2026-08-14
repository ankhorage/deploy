import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { inspectAppStoreReleaseState } from '../../providers/appStoreConnect/inspectAppStoreReleaseState';
import type { ProjectReleaseMutationContext } from './ProjectReleaseMutationContext';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';

export async function executeProjectReleaseIosMutation(options: {
  readonly step: ReleasePlanStep;
  readonly context: ProjectReleaseMutationContext;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ReleaseMutationResult> {
  const target = options.context.targets.ios;
  if (target === undefined) return failed('PROJECT_RELEASE_IOS_TARGET_REQUIRED');
  const inspected = await inspectAppStoreReleaseState({
    bundleIdentifier: target.bundleIdentifier,
    version: options.context.desired.version,
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (inspected.status === 'action-required') {
    return { status: 'blocked', code: inspected.action.code };
  }
  if (inspected.status === 'failed') return failed(inspected.failure.code);
  return options.runtime.executeAppStoreMutation({
    step: options.step,
    desired: options.context.desired,
    snapshot: inspected.state,
    credentials: options.context.access.credentials,
    resolveSecret: options.context.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
