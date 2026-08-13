import type { AppStoreMonetizationLocalizationResource } from './AppStoreMonetizationSnapshot';

export interface AppStoreProductVersion {
  readonly resourceId: string;
  readonly state: string;
  readonly localizations: readonly AppStoreMonetizationLocalizationResource[];
}
