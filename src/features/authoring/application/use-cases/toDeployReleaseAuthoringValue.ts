import type { ProjectReleaseInput } from '../../../../project/release/ProjectReleaseInput';
import type { DeployReleaseAuthoringValue } from '../../../../types/deployAuthoring';
import { createDeployAuthoringRegistry } from '../../utils/createDeployAuthoringRegistry';

/*** Project canonical release input into set membership and stable release-note identity for authoring. */
export function toDeployReleaseAuthoringValue(
  release: ProjectReleaseInput,
): DeployReleaseAuthoringValue {
  const targetEntries = release.targets.map((target) => [target, true] as const);
  const targetKeys = targetEntries.map(([target]) => target);
  if (new Set(targetKeys).size !== targetKeys.length) {
    throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
  }

  return {
    version: release.version,
    targets: Object.fromEntries(targetEntries),
    notes: createDeployAuthoringRegistry(
      release.notes.map((note) => [note.locale, note] as const),
    ),
    rollout: release.rollout,
  };
}
