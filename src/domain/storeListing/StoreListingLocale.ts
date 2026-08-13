export interface StoreListingLocale {
  readonly locale: string;
  readonly name: string;
  readonly summary?: string;
  readonly description?: string;
  readonly keywords?: readonly string[];
  readonly promotionalText?: string;
  readonly supportUrl?: string;
  readonly marketingUrl?: string;
  readonly privacyPolicyUrl?: string;
  readonly promoVideoUrl?: string;
}
