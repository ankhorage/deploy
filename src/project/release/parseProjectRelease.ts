import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { ReleaseRollout } from '../../domain/release/ReleaseRollout';
import type { ReleaseTarget } from '../../domain/release/ReleaseTarget';
import type { ReleaseTargetRollout } from '../../domain/release/ReleaseTargetRollout';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';

const ROOT_KEYS = new Set(['version', 'targets', 'notes', 'rollout']);
const NOTE_KEYS = new Set(['locale', 'text']);
const ROLLOUT_KEYS = new Set(['web', 'android', 'ios']);
const TARGET_ROLLOUT_KEYS = new Set(['mode', 'initialFraction']);
const TARGETS = new Set<ReleaseTarget>(['web', 'android', 'ios']);

export interface ParsedProjectRelease {
  readonly version: string;
  readonly targets: readonly ReleaseTarget[];
  readonly notes: readonly ReleaseNote[];
  readonly rollout: ReleaseRollout;
}

export function parseProjectRelease(value: unknown): ParsedProjectRelease {
  if (!isRecord(value) || !hasOnlyKeys(value, ROOT_KEYS)) throw invalid();
  return {
    version: parseVersion(value.version),
    targets: parseTargets(value.targets),
    notes: parseNotes(value.notes),
    rollout: parseRollout(value.rollout),
  };
}

function parseVersion(value: unknown): string {
  if (typeof value !== 'string' || !/^\d+(\.\d+){0,2}$/.test(value)) throw invalid();
  return value;
}

function parseTargets(value: unknown): readonly ReleaseTarget[] {
  if (!Array.isArray(value) || value.length === 0) throw invalid();
  const targets = value.map(parseTarget).sort();
  if (new Set(targets).size !== targets.length) throw invalid();
  return targets;
}

function parseTarget(value: unknown): ReleaseTarget {
  if (typeof value !== 'string' || !TARGETS.has(value as ReleaseTarget)) throw invalid();
  return value as ReleaseTarget;
}

function parseNotes(value: unknown): readonly ReleaseNote[] {
  if (!Array.isArray(value)) throw invalid();
  const notes = value.map(parseNote).sort((a, b) => a.locale.localeCompare(b.locale));
  if (new Set(notes.map((note) => note.locale)).size !== notes.length) throw invalid();
  return notes;
}

function parseNote(value: unknown): ReleaseNote {
  if (!isRecord(value) || !hasOnlyKeys(value, NOTE_KEYS)) throw invalid();
  if (typeof value.text !== 'string' || value.text.trim().length === 0) throw invalid();
  return { locale: normalizeLocale(value.locale), text: value.text };
}

function parseRollout(value: unknown): ReleaseRollout {
  if (!isRecord(value) || !hasOnlyKeys(value, ROLLOUT_KEYS)) throw invalid();
  return {
    ...(value.web === undefined ? {} : { web: parseWebRollout(value.web) }),
    ...(value.android === undefined ? {} : { android: parseAndroidRollout(value.android) }),
    ...(value.ios === undefined ? {} : { ios: parseIosRollout(value.ios) }),
  };
}

function parseWebRollout(value: unknown): ReleaseTargetRollout {
  const rollout = parseTargetRollout(value);
  if (rollout.mode !== 'immediate' || rollout.initialFraction !== undefined) throw invalid();
  return rollout;
}

function parseAndroidRollout(value: unknown): ReleaseTargetRollout {
  const rollout = parseTargetRollout(value);
  if (rollout.mode === 'staged') {
    if (rollout.initialFraction === undefined) throw invalid();
    return { mode: 'staged', initialFraction: normalizeFraction(rollout.initialFraction) };
  }
  if (rollout.initialFraction !== undefined) throw invalid();
  return { mode: 'immediate' };
}

function parseIosRollout(value: unknown): ReleaseTargetRollout {
  const rollout = parseTargetRollout(value);
  if (rollout.initialFraction !== undefined) throw invalid();
  return { mode: rollout.mode };
}

function parseTargetRollout(value: unknown): ReleaseTargetRollout {
  if (!isRecord(value) || !hasOnlyKeys(value, TARGET_ROLLOUT_KEYS)) throw invalid();
  if (value.mode !== 'immediate' && value.mode !== 'staged') throw invalid();
  if (value.initialFraction !== undefined && typeof value.initialFraction !== 'string') {
    throw invalid();
  }
  return {
    mode: value.mode,
    ...(value.initialFraction === undefined ? {} : { initialFraction: value.initialFraction }),
  };
}

function normalizeFraction(value: string): string {
  if (!/^0\.\d{1,6}$/.test(value)) throw invalid();
  const digits = value.slice(2).replace(/0+$/, '');
  if (digits.length === 0) throw invalid();
  return `0.${digits}`;
}

function normalizeLocale(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw invalid();
  try {
    const locales = Intl.getCanonicalLocales(value);
    if (locales.length !== 1 || locales[0] === undefined) throw invalid();
    return locales[0];
  } catch {
    throw invalid();
  }
}

function invalid(): Error {
  return new Error('RELEASE_INVALID');
}
