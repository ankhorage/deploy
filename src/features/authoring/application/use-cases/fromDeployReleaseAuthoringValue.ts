import type { ProjectReleaseInput } from '../../../../project/release/ProjectReleaseInput';
import { parseProjectRelease } from '../../../../project/release/parseProjectRelease';
import type { DeployReleaseAuthoringValue } from '../../../../types/deployAuthoring';
import { readDeployAuthoringRegistryValues } from '../../utils/readDeployAuthoringRegistryValues';

/*** Convert authored set/registry values back through Deploy's canonical release parser and validation. */
export function fromDeployReleaseAuthoringValue(
  value: DeployReleaseAuthoringValue,
): ProjectReleaseInput {
  const targets = Object.entries(value.targets).map(([target, member]) => {
    if (member !== true) throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
    return target;
  });
  const notes = readDeployAuthoringRegistryValues(value.notes, (note) => note.locale);
  return parseProjectRelease({
    version: value.version,
    targets,
    notes,
    rollout: value.rollout,
  });
}
