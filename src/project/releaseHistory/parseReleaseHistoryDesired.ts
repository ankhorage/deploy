import { createReleaseRevision } from '../../domain/release/createReleaseRevision';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';
import { parseProjectRelease } from '../release/parseProjectRelease';

const KEYS = new Set(['version', 'targets', 'notes', 'rollout', 'revision']);

export function parseReleaseHistoryDesired(value: unknown): ReleaseDesiredState {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  const parsed = parseProjectRelease({
    version: value.version,
    targets: value.targets,
    notes: value.notes,
    rollout: value.rollout,
  });
  if (typeof value.revision !== 'string') throw invalid();
  const revision = createReleaseRevision(parsed);
  if (value.revision !== revision) throw invalid();
  return { ...parsed, revision };
}

function invalid(): Error {
  return new Error('Release history has an invalid desired release.');
}
