export interface ResolvedProjectStoreListingAssetLocation {
  readonly filePath: string;
  readonly filename: string;
  readonly locale?: string;
  readonly cleanupDirectories: readonly string[];
}
