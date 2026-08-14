import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { resolveDeployProject } from '../resolveDeployProject';
import type { ProjectReleaseAccess } from './ProjectReleaseAccess';
import type { ProjectReleaseMutationContext } from './ProjectReleaseMutationContext';
import { readProjectRelease } from './readProjectRelease';
import { resolveProjectReleaseAccess } from './resolveProjectReleaseAccess';
import { resolveProjectReleaseTargets } from './resolveProjectReleaseTargets';

type MutationContextResult =
  | { readonly ok: true; readonly context: ProjectReleaseMutationContext }
  | { readonly ok: false; readonly mutation: ReleaseMutationResult };

export async function resolveProjectReleaseMutationContext(options: {
  readonly projectRoot: string;
  readonly expectedRevision: string;
  readonly access: ProjectReleaseAccess;
}): Promise<MutationContextResult> {
  try {
    const project = await resolveDeployProject({ projectRoot: options.projectRoot });
    const desired = await readProjectRelease({ projectRoot: project.projectRoot });
    if (desired.revision !== options.expectedRevision) {
      return blocked('PROJECT_RELEASE_DESIRED_STATE_DRIFTED');
    }
    const access = resolveProjectReleaseAccess(options.access);
    const targets = resolveProjectReleaseTargets(project.deploy, desired, access);
    if (!targets.ok) return failed(targets.failure.code);
    return {
      ok: true,
      context: {
        projectRoot: project.projectRoot,
        desired,
        targets: targets.targets,
        access,
      },
    };
  } catch {
    return failed('PROJECT_RELEASE_MUTATION_CONTEXT_FAILED');
  }
}

function blocked(code: string): MutationContextResult {
  return { ok: false, mutation: { status: 'blocked', code } };
}

function failed(code: string): MutationContextResult {
  return { ok: false, mutation: { status: 'failed', code } };
}
