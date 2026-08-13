import type { MonetizationDiagnostic } from '../../domain/monetization/MonetizationDiagnostic';
import type { MonetizationLocalization } from '../../domain/monetization/MonetizationLocalization';
import type { MonetizationProductKind } from '../../domain/monetization/MonetizationProduct';
import type { MonetizationSubscriptionPeriod } from '../../domain/monetization/MonetizationSubscription';

export interface AppStoreMonetizationLocalizationResource extends MonetizationLocalization {
  readonly resourceId: string;
}

export interface AppStoreMonetizationProductResource {
  readonly resourceId: string;
  readonly productId: string;
  readonly kind: MonetizationProductKind;
  readonly localizations: readonly AppStoreMonetizationLocalizationResource[];
  readonly basePriceMatches: boolean;
  readonly state?: string;
  readonly family?: string;
  readonly familyId?: string;
  readonly period?: MonetizationSubscriptionPeriod;
  readonly level?: number;
}

export interface AppStoreMonetizationFamilyResource {
  readonly resourceId: string;
  readonly referenceName: string;
}

export interface AppStoreMonetizationSnapshot {
  readonly appId: string;
  readonly products: readonly AppStoreMonetizationProductResource[];
  readonly families: readonly AppStoreMonetizationFamilyResource[];
  readonly diagnostics: readonly MonetizationDiagnostic[];
}
