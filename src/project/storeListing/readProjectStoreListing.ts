import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import type { ProjectStoreListing } from './ProjectStoreListing';
import { createProjectStoreListingRevision } from './createProjectStoreListingRevision';
import { readStoreListingAssetSets } from './readStoreListingAssets';
import { readStoreListingLocales } from './readStoreListingLocales';

export async function readProjectStoreListing(options: {
  readonly projectRoot: string;
}): Promise<ProjectStoreListing> {
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  const locales = await readStoreListingLocales(paths.listingRoot);
  const assetSets = await readStoreListingAssetSets({
    projectRoot: paths.projectRoot,
    androidRoot: paths.androidAssetsRoot,
    iosRoot: paths.iosScreenshotsRoot,
    locales: locales.map((item) => item.locale),
  });
  assertAssetLocales(locales.map((item) => item.locale), assetSets.map((item) => item.locale));
  return { locales, assetSets, revision: createProjectStoreListingRevision(locales, assetSets) };
}

function assertAssetLocales(locales: readonly string[], assetLocales: readonly string[]): void {
  const known = new Set(locales);
  for (const locale of assetLocales) {
    if (!known.has(locale)) throw new Error('STORE_LISTING_ASSET_LOCALE_UNKNOWN');
  }
}
