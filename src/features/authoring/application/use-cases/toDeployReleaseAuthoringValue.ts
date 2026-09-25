import type { ReleaseRollout } from '../../../../domain/release/ReleaseRollout';
import type { ProjectReleaseInput } from '../../../../project/release/ProjectReleaseInput';
import { parseProjectRelease } from '../../../../project/release/parseProjectRelease';
import type {
  DeployReleaseAuthoringRollout,
  DeployReleaseAuthoringValue,
} from '../../../../types/deployAuthoring';
import { createDeployAuthoringRegistry } from '../../utils/createDeployAuthoringRegistry';

/*** Project canonical release input into set membership and stable release-note identity for authoring. */
export function toDeployReleaseAuthoringValue(
  release: ProjectReleaseInput,
): DeployReleaseAuthoringValue {
  const canonical = parseProjectRelease(release);
  return {
    version: canonical.version,
    targets: Object.fromEntries(canonical.targets.map((target) => [target, true] as const)),
    notes: createDeployAuthoringRegistry(
      canonical.notes.map((note) => [note.locale, note] as const),
    ),
    rollout: toAuthoringRollout(canonical.rollout),
  };
}

/*** Project parser-validated per-target rollout constraints into the narrower authoring contract. */
function toAuthoringRollout(rollout: ReleaseRollout): DeployReleaseAuthoringRollout {
  const android = rollout.android;
  const androidAuthoring =
    android?.mode === 'staged'
      ? stagedAndroidRollout(android.initialFraction)
      : android === undefined
        ? undefined
        : { mode: 'immediate' as const };

  return {
    ...(rollout.web === undefined ? {} : { web: { mode: 'immediate' as const } }),
    ...(androidAuthoring === undefined ? {} : { android: androidAuthoring }),
    ...(rollout.ios === undefined ? {} : { ios: { mode: rollout.ios.mode } }),
  };
}

/*** Require the initial fraction guaranteed by canonical parsing for staged Android rollout. */
function stagedAndroidRollout(
  initialFraction: string | undefined,
): Extract<
  NonNullable<DeployReleaseAuthoringRollout['android']>,
  { readonly mode: 'staged' }
> {
  if (initialFraction === undefined) throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
  return { mode: 'staged', initialFraction };
}
