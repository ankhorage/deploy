import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { resolveRegisteredReleaseAdapter } from '../../features/release-management/adapters/inbound/resolveRegisteredReleaseAdapter.js';
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
  const adapter = resolveRegisteredReleaseAdapter({
    providers: options.runtime.providers,
    providerId: options.target.provider,
    target: 'android',
  });
  if (adapter === undefined) return unavailable(options.target.provider);
  const inspected = await adapter.inspectAsync({
    identity: { target: 'android', packageName: options.target.packageName },
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
    version: options.desired.version,
  });
  if (inspected.status === 'failed') return { ok: false, failure: inspected.failure };
  if (inspected.status === 'action-required') {
    return { ok: true, state: missingState(), actions: [inspected.action] };
  }
  if (inspected.value.target !== 'android') return unavailable(options.target.provider);
  const publication = await readProjectReleaseAndroidArtifact({
    projectRoot: options.projectRoot,
    target: options.target,
    observed: inspected.value,
  });
  return {
    ok: true,
    state: {
      ...inspected.value,
      artifactRevision: publication?.revision ?? null,
    },
    actions: [],
  };
}

function unavailable(provider: string): ProjectReleaseTargetInspection {
  return {
    ok: false,
    failure: {
      code: 'PROJECT_RELEASE_ANDROID_PROVIDER_UNAVAILABLE',
      message: 'Android release provider is unavailable.',
      target: 'android',
      provider,
    },
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
