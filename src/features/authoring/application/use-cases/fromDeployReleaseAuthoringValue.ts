import { parseProjectRelease } from '../../../../project/release/parseProjectRelease';
import type { ProjectReleaseInput } from '../../../../project/release/ProjectReleaseInput';
import type { DeployReleaseAuthoringValue } from '../../../../types/deployAuthoring';
import { readDeployAuthoringRegistryValues } from '../../utils/readDeployAuthoringRegistryValues';

/*** Convert authored set/registry values back through Deploy's canonical release parser and validation. */
export function fromDeployReleaseAuthoringValue(
  value: DeployReleaseAuthoringValue,
): ProjectReleaseInput {
  const targets = Object.keys(value.targets);
  const notes = readDeployAuthoringRegistryValues(value.notes, (note) => note.locale);
  return parseProjectRelease({
    version: value.version,
    targets,
    notes,
    rollout: value.rollout,
  });
}
