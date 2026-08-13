import type { StoreListingAsset } from './StoreListingAsset';
import type { StoreListingAssetSet } from './StoreListingAssetSet';
import type { StoreListingDesiredState } from './StoreListingDesiredState';
import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';
import type { StoreListingPlan } from './StoreListingPlan';
import type { StoreListingPlanStep } from './StoreListingPlanStep';
import type { StoreListingRemoteAssetSet } from './StoreListingRemoteAssetSet';
import type { StoreListingTargetState } from './StoreListingTargetState';
import { storeListingLocaleFieldValue } from './storeListingLocaleFieldValue';

export function createStoreListingPlan(options: {
  readonly desired: StoreListingDesiredState;
  readonly currentRevision: string;
  readonly states: readonly StoreListingTargetState[];
}): StoreListingPlan {
  const diagnostics = options.states.flatMap((state) => state.diagnostics);
  const steps = options.states.flatMap((state) => createTargetSteps(options.desired, state));
  const blocked = diagnostics.some((diagnostic) => diagnostic.severity === 'error');
  return {
    status: blocked ? 'blocked' : steps.length === 0 ? 'no-change' : 'changes',
    desiredRevision: options.desired.revision,
    currentRevision: options.currentRevision,
    steps: steps.slice().sort(compareSteps),
    diagnostics,
  };
}

function createTargetSteps(
  desired: StoreListingDesiredState,
  state: StoreListingTargetState,
): StoreListingPlanStep[] {
  return [
    ...desired.locales.flatMap((locale) => metadataStep(locale, state)),
    ...desired.assetSets
      .filter((set) => set.target === state.target)
      .flatMap((set) => assetStep(set, state)),
  ];
}

function metadataStep(
  desired: StoreListingLocale,
  state: StoreListingTargetState,
): StoreListingPlanStep[] {
  const current = state.locales.find((locale) => locale.locale === desired.locale);
  const managed = state.supportedFields.filter((field) => isManaged(desired, field));
  if (managed.length === 0) return [];
  const changed = current === undefined || managed.some((field) => !fieldEqual(desired, current, field));
  if (!changed) return [];
  const operation = current === undefined ? 'create-locale' : 'update-locale';
  return [{
    id: `${state.target}:${desired.locale}:metadata`,
    target: state.target,
    operation,
    locale: desired.locale,
  }];
}

function assetStep(
  desired: StoreListingAssetSet,
  state: StoreListingTargetState,
): StoreListingPlanStep[] {
  const current = findAssetSet(state.assetSets, desired.locale, desired.variant);
  const checksum = current?.checksum ?? (state.target === 'ios' ? 'md5' : 'sha256');
  const hashes = desired.assets.map((asset) => assetHash(asset, checksum));
  if (current !== undefined && arraysEqual(hashes, current.hashes)) return [];
  return [{
    id: `${state.target}:${desired.locale}:assets:${desired.variant}`,
    target: state.target,
    operation: 'replace-assets',
    locale: desired.locale,
    variant: desired.variant,
  }];
}

function findAssetSet(
  sets: readonly StoreListingRemoteAssetSet[],
  locale: string,
  variant: string,
): StoreListingRemoteAssetSet | undefined {
  return sets.find((set) => set.locale === locale && set.variant === variant);
}

function assetHash(asset: StoreListingAsset, checksum: 'md5' | 'sha256'): string {
  return checksum === 'md5' ? asset.md5 : asset.sha256;
}

function isManaged(listing: StoreListingLocale, field: StoreListingField): boolean {
  return storeListingLocaleFieldValue(listing, field) !== undefined;
}

function fieldEqual(
  desired: StoreListingLocale,
  current: StoreListingLocale,
  field: StoreListingField,
): boolean {
  return JSON.stringify(storeListingLocaleFieldValue(desired, field)) ===
    JSON.stringify(storeListingLocaleFieldValue(current, field));
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b);
}

function compareSteps(a: StoreListingPlanStep, b: StoreListingPlanStep): number {
  const target = a.target.localeCompare(b.target);
  if (target !== 0) return target;
  const locale = a.locale.localeCompare(b.locale);
  if (locale !== 0) return locale;
  const rank = operationRank(a) - operationRank(b);
  return rank !== 0 ? rank : (a.variant ?? '').localeCompare(b.variant ?? '');
}

function operationRank(step: StoreListingPlanStep): number {
  return step.operation === 'replace-assets' ? 1 : 0;
}
