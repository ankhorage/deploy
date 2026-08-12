import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import { isNonEmptyString } from './isNonEmptyString';
import { isRecord } from './isRecord';

export function normalizeCredentialReferences(
  value: unknown,
  provider: string,
): readonly DeploymentCredentialReference[] | null {
  if (!Array.isArray(value)) return null;

  const references: DeploymentCredentialReference[] = [];
  for (const reference of value) {
    if (
      !isRecord(reference) ||
      reference.provider !== provider ||
      !isNonEmptyString(reference.id) ||
      !isNonEmptyString(reference.kind)
    ) {
      return null;
    }
    references.push({ provider, id: reference.id, kind: reference.kind });
  }
  return references;
}
