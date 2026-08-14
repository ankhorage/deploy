export type ProjectStoreListingAssetLocation =
  | {
      readonly kind: 'android-shared';
      readonly variant: 'icon' | 'feature';
    }
  | {
      readonly kind: 'screenshot';
      readonly target: 'android' | 'ios';
      readonly locale: string;
      readonly variant: string;
      readonly filename: string;
    };
