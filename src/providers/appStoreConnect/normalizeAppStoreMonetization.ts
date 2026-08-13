import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationDiagnostic } from '../../domain/monetization/MonetizationDiagnostic';
import type { MonetizationObservedProduct } from '../../domain/monetization/MonetizationObservedProduct';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';
import type {
  AppStoreMonetizationProductResource,
  AppStoreMonetizationSnapshot,
} from './AppStoreMonetizationSnapshot';

const EDITABLE_SUBSCRIPTION_STATES = new Set(['MISSING_METADATA', 'READY_TO_SUBMIT']);

export function normalizeAppStoreMonetization(
  desired: MonetizationDesiredState,
  snapshot: AppStoreMonetizationSnapshot,
): MonetizationTargetState {
  const diagnostics = [...snapshot.diagnostics];
  const products = desired.products.flatMap((product) =>
    normalizeProduct(product, snapshot, diagnostics),
  );
  return {
    target: 'ios',
    products,
    subscriptionFamilies: snapshot.families.map((item) => item.referenceName).sort(),
    diagnostics,
  };
}

function normalizeProduct(
  desired: MonetizationProduct,
  snapshot: AppStoreMonetizationSnapshot,
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct[] {
  const current = snapshot.products.find((item) => item.productId === desired.id);
  if (current === undefined) return [];
  if (desired.kind === 'subscription') {
    validateSubscription(desired, current, diagnostics);
  }
  return [
    {
      id: current.productId,
      kind: current.kind,
      localizations: current.localizations.map(({ resourceId: _resourceId, ...item }) => item),
      ...(current.basePriceMatches ? { basePrice: desired.basePrice } : {}),
      ...(current.kind === 'subscription' &&
      current.family !== undefined &&
      current.period !== undefined
        ? {
            subscription: {
              family: current.family,
              period: current.period,
              ...(current.level === undefined ? {} : { level: current.level }),
            },
          }
        : {}),
    },
  ];
}

function validateSubscription(
  desired: MonetizationProduct,
  current: AppStoreMonetizationProductResource,
  diagnostics: MonetizationDiagnostic[],
): void {
  const { subscription } = desired;
  if (subscription === undefined) return;
  if (current.family !== subscription.family) {
    diagnostics.push(error(desired.id, 'APP_STORE_SUBSCRIPTION_GROUP_CONFLICT'));
  }
  if (
    current.period !== subscription.period &&
    current.state !== undefined &&
    !EDITABLE_SUBSCRIPTION_STATES.has(current.state)
  ) {
    diagnostics.push(error(desired.id, 'APP_STORE_SUBSCRIPTION_PERIOD_LOCKED'));
  }
}

function error(productId: string, code: string): MonetizationDiagnostic {
  return {
    severity: 'error',
    code,
    message: `App Store subscription ${productId} requires manual provider action.`,
    target: 'ios',
    productId,
  };
}
