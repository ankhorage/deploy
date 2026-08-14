import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { AppStoreReleaseSnapshot } from '../../providers/appStoreConnect/AppStoreReleaseSnapshot';
import { inspectAppStoreConnectIos } from '../../providers/appStoreConnect/inspectAppStoreConnectIos';
import { inspectAppStoreReleaseState } from '../../providers/appStoreConnect/inspectAppStoreReleaseState';
import { normalizeAppStoreReleaseObservation } from '../../providers/appStoreConnect/normalizeAppStoreReleaseObservation';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import type { ProjectReleaseTargetInspection } from './ProjectReleaseTargetInspection';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';
import { readProjectReleaseIosArtifact } from './readProjectReleaseIosArtifact';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

export async function inspectProjectReleaseIos(options: {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
  readonly target: NonNullable<ProjectReleaseTargets['ios']>;
  readonly access: ResolvedProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ProjectReleaseTargetInspection> {
  const release = await inspectRelease(options);
  if (release.status === 'failed') return { ok: false, failure: release.failure };
  if (release.status === 'action-required') {
    return { ok: true, state: missingState(), actions: [release.action] };
  }
  return inspectArtifact(options, release.state);
}

async function inspectArtifact(
  options: Parameters<typeof inspectProjectReleaseIos>[0],
  snapshot: AppStoreReleaseSnapshot,
): Promise<ProjectReleaseTargetInspection> {
  const appStore = await inspectAppStoreConnectIos({
    bundleIdentifier: options.target.bundleIdentifier,
    version: options.desired.version,
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (appStore.status === 'failed') return { ok: false, failure: appStore.failure };
  if (appStore.status === 'action-required') {
    return success(snapshot, null, [appStore.action]);
  }
  const publication = await readProjectReleaseIosArtifact({
    projectRoot: options.projectRoot,
    version: options.desired.version,
    target: options.target,
    appStoreState: appStore.state,
  });
  return success(snapshot, publication, []);
}

function inspectRelease(options: Parameters<typeof inspectProjectReleaseIos>[0]) {
  return inspectAppStoreReleaseState({
    bundleIdentifier: options.target.bundleIdentifier,
    version: options.desired.version,
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
}

function success(
  snapshot: AppStoreReleaseSnapshot,
  publication: Parameters<typeof normalizeAppStoreReleaseObservation>[0]['publication'],
  actions: Extract<ProjectReleaseTargetInspection, { readonly ok: true }>['actions'],
): ProjectReleaseTargetInspection {
  return {
    ok: true,
    state: normalizeAppStoreReleaseObservation({
      publication,
      publicationVerified: publication !== null,
      snapshot,
    }),
    actions,
  };
}

function missingState(): Extract<ProjectReleaseTargetInspection, { readonly ok: true }>['state'] {
  return {
    target: 'ios',
    version: null,
    artifactRevision: null,
    buildNumber: null,
    releaseNotes: [],
    phasedReleaseState: null,
  };
}
