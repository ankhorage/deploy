import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { resolveRegisteredReleaseAdapter } from '../../features/release-management/adapters/inbound/resolveRegisteredReleaseAdapter.js';
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
  const adapter = resolveRegisteredReleaseAdapter({
    providers: options.runtime.providers,
    providerId: options.target.provider,
    target: 'ios',
  });
  if (adapter === undefined) return unavailable(options.target.provider);
  const inspected = await adapter.inspectAsync({
    identity: { target: 'ios', bundleIdentifier: options.target.bundleIdentifier },
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
    version: options.desired.version,
  });
  if (inspected.status === 'failed') return { ok: false, failure: inspected.failure };
  if (inspected.status === 'action-required') {
    return { ok: true, state: missingState(), actions: [inspected.action] };
  }
  if (inspected.value.target !== 'ios') return unavailable(options.target.provider);
  const publication = await readProjectReleaseIosArtifact({
    projectRoot: options.projectRoot,
    version: options.desired.version,
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
      code: 'PROJECT_RELEASE_IOS_PROVIDER_UNAVAILABLE',
      message: 'iOS release provider is unavailable.',
      target: 'ios',
      provider,
    },
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
