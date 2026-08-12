import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import { normalizeWebProviders } from '../../targets/web/normalizeWebProviders';

export type NormalizeProjectWebDesiredResult =
  | { readonly ok: true; readonly desired: AppDeployManifest; readonly enabled: boolean }
  | { readonly ok: false; readonly failure: DeploymentFailure };

export function normalizeProjectWebDesired(
  deploy: AppDeployManifest | null,
): NormalizeProjectWebDesiredResult {
  const web = deploy?.targets.web;
  if (web?.enabled !== true) {
    return { ok: true, desired: { targets: {} }, enabled: false };
  }
  const normalized = normalizeWebProviders(web.providers);
  if (!normalized.ok) return normalized;
  return {
    ok: true,
    enabled: true,
    desired: {
      targets: {
        web: { enabled: true, providers: normalized.providers },
      },
    },
  };
}
