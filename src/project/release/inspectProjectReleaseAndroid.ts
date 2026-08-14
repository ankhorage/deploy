import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { inspectGooglePlayReleaseState } from '../../providers/googlePlay/inspectGooglePlayReleaseState';
import { normalizeGooglePlayReleaseObservation } from '../../providers/googlePlay/normalizeGooglePlayReleaseObservation';
import type { ProjectReleaseRuntime } from './ProjectReleaseRuntime';
import type { ProjectReleaseTargetInspection } from './ProjectReleaseTargetInspection';
import type { ProjectReleaseTargets } from './ProjectReleaseTargets';
import { readProjectReleaseAndroidArtifact } from './readProjectReleaseAndroidArtifact';
import type { ResolvedProjectReleaseAccess } from './ResolvedProjectReleaseAccess';

export async function inspectProjectReleaseAndroid(options: {
  readonly projectRoot: string;
  readonly desired: ReleaseDesiredState;
  readonly target: NonNullable<ProjectReleaseTargets['android']>;
  readonly access: ResolvedProjectReleaseAccess;
  readonly runtime: ProjectReleaseRuntime;
}): Promise<ProjectReleaseTargetInspection> {
  const inspected = await inspectGooglePlayReleaseState({
    packageName: options.target.packageName,
    track: options.target.track,
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  if (inspected.status === 'failed') return { ok: false, failure: inspected.failure };
  if (inspected.status === 'action-required') {
    return { ok: true, state: missingState(), actions: [inspected.action] };
  }
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: options.projectRoot,
    target: options.target,
    snapshot: inspected.state,
  });
  return {
    ok: true,
    state: normalizeGooglePlayReleaseObservation({
      desiredVersion: options.desired.version,
      publication,
      snapshot: inspected.state,
    }),
    actions: [],
  };
}

function missingState(): Extract<ProjectReleaseTargetInspection, { readonly ok: true }>['state'] {
  return {
    target: 'android',
    version: null,
    artifactRevision: null,
    versionCodes: [],
    releaseNotes: [],
    rolloutStatus: 'missing',
  };
}
