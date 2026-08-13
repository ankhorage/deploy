export interface AppStoreListingLocaleResource {
  readonly canonicalLocale: string;
  readonly providerLocale: string;
  readonly appInfoLocalizationId?: string;
  readonly versionLocalizationId?: string;
  readonly name?: string;
  readonly summary?: string;
  readonly description?: string;
  readonly keywords?: string;
  readonly promotionalText?: string;
  readonly supportUrl?: string;
  readonly marketingUrl?: string;
  readonly privacyPolicyUrl?: string;
}

export interface AppStoreListingContext {
  readonly appId: string;
  readonly appInfoId: string;
  readonly versionId: string;
  readonly locales: readonly AppStoreListingLocaleResource[];
}
