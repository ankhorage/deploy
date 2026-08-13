import type { StoreListingAsset, StoreListingTarget } from './StoreListingAsset';
import type { StoreListingCurrentAsset, StoreListingTargetCurrentState } from './StoreListingCurrentState';
import type { StoreListingDesiredState } from './StoreListingDesiredState';
import type { StoreListingDiagnostic } from './StoreListingDiagnostic';
import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';
import type { StoreListingPlan, StoreListingPlanOperation } from './StoreListingPlan';

const TARGET_ORDER: readonly StoreListingTarget[] = ['android', 'ios'];

export function createStoreListingPlan(input: {
  readonly desired: StoreListingDesiredState;
  readonly current: readonly StoreListingTargetCurrentState[];
  readonly diagnostics?: readonly StoreListingDiagnostic[];
}): StoreListingPlan {
  const operations = TARGET_ORDER.flatMap((target) => createTargetOperations(input.desired, targetState(input.current, target)));
  const sorted = operations.toSorted(compareOperations);
  return {
    revision: input.desired.revision,
    operations: sorted,
    diagnostics: [...(input.diagnostics ?? [])],
    hasChanges: sorted.some((operation) => operation.action !== 'no-change'),
  };
}

function createTargetOperations(
  desired: StoreListingDesiredState,
  current: StoreListingTargetCurrentState | null,
): StoreListingPlanOperation[] {
  if (current === null) return [];
  return [
    ...metadataOperations(desired.locales, current),
    ...assetOperations(desired.assets.filter((asset) => asset.target === current.target), current),
  ];
}

function metadataOperations(
  desired: readonly StoreListingLocale[],
  current: StoreListingTargetCurrentState,
): StoreListingPlanOperation[] {
  return desired.map((locale) => {
    const existing = current.locales.find((item) => item.locale === locale.locale);
    const action = existing === undefined ? 'create' : metadataEqual(locale, existing, current.supportedFields) ? 'no-change' : 'update';
    return { target: current.target, locale: locale.locale, resourceKind: 'metadata', action };
  });
}

function assetOperations(
  desired: readonly StoreListingAsset[],
  current: StoreListingTargetCurrentState,
): StoreListingPlanOperation[] {
  const keys = new Set([...desired.map(assetGroupKey), ...current.assets.map(assetGroupKey)]);
  return [...keys].map((key) => createAssetOperation(key, desired, current));
}

function createAssetOperation(
  key: string,
  desired: readonly StoreListingAsset[],
  current: StoreListingTargetCurrentState,
): StoreListingPlanOperation {
  const wanted = desired.filter((asset) => assetGroupKey(asset) === key).toSorted(byPath);
  const observed = current.assets.filter((asset) => assetGroupKey(asset) === key);
  const sample = wanted[0] ?? observed[0];
  if (sample === undefined) throw new Error('Store listing asset group cannot be empty.');
  const action = assetAction(wanted, observed);
  return {
    target: current.target,
    locale: sample.locale,
    resourceKind: 'asset',
    action,
    ...(sample.variant === null ? {} : { variant: sample.variant }),
    paths: wanted.map((asset) => asset.relativePath),
  };
}

function assetAction(
  desired: readonly StoreListingAsset[],
  current: readonly StoreListingCurrentAsset[],
): StoreListingPlanOperation['action'] {
  if (desired.length === 0) return 'delete';
  if (current.length === 0) return 'create';
  const desiredChecksums = desired.map((asset) => assetChecksum(asset, current[0]?.checksumAlgorithm ?? 'sha256'));
  const currentChecksums = current.map((asset) => asset.remoteChecksum);
  if (sameSequence(desiredChecksums, currentChecksums)) return 'no-change';
  if (sameSet(desiredChecksums, currentChecksums)) return 'reorder';
  return 'update';
}

function metadataEqual(
  desired: StoreListingLocale,
  current: StoreListingLocale,
  fields: readonly StoreListingField[],
): boolean {
  return fields.every((field) => JSON.stringify(desired[field]) === JSON.stringify(current[field]));
}

function assetChecksum(asset: StoreListingAsset, algorithm: 'sha256' | 'md5'): string {
  return algorithm === 'sha256' ? asset.sha256 : asset.md5;
}

function assetGroupKey(asset: StoreListingAsset): string {
  return `${asset.target}:${asset.locale ?? ''}:${asset.kind}:${asset.variant ?? ''}`;
}

function sameSequence(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

function targetState(
  states: readonly StoreListingTargetCurrentState[],
  target: StoreListingTarget,
): StoreListingTargetCurrentState | null {
  return states.find((state) => state.target === target) ?? null;
}

function byPath(left: StoreListingAsset, right: StoreListingAsset): number {
  return left.relativePath.localeCompare(right.relativePath);
}

function compareOperations(left: StoreListingPlanOperation, right: StoreListingPlanOperation): number {
  const target = TARGET_ORDER.indexOf(left.target) - TARGET_ORDER.indexOf(right.target);
  if (target !== 0) return target;
  const locale = (left.locale ?? '').localeCompare(right.locale ?? '');
  if (locale !== 0) return locale;
  const kind = left.resourceKind.localeCompare(right.resourceKind);
  if (kind !== 0) return kind;
  return (left.variant ?? '').localeCompare(right.variant ?? '');
}
