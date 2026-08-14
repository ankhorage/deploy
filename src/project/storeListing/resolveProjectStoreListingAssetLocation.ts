import path from 'node:path';

import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import type { ProjectDeploymentPaths } from '../ProjectDeploymentPaths';
import type { ProjectStoreListingAssetLocation } from './ProjectStoreListingAssetLocation';
import type { ResolvedProjectStoreListingAssetLocation } from './ResolvedProjectStoreListingAssetLocation';

export function resolveProjectStoreListingAssetLocation(
  paths: ProjectDeploymentPaths,
  location: ProjectStoreListingAssetLocation,
): ResolvedProjectStoreListingAssetLocation {
  if (location.kind === 'android-shared') {
    const filename = location.variant === 'icon' ? 'icon.png' : 'feature.png';
    return {
      filePath: path.join(paths.androidAssetsRoot, filename),
      filename,
      cleanupDirectories: [],
    };
  }

  const locale = normalizeStoreListingLocale(location.locale);
  assertPathSegment(location.variant);
  assertImageFilename(location.filename);
  const root =
    location.target === 'android' ? paths.androidScreenshotsRoot : paths.iosScreenshotsRoot;
  const localeRoot = path.join(root, locale);
  const variantRoot = path.join(localeRoot, location.variant);
  return {
    filePath: path.join(variantRoot, location.filename),
    filename: location.filename,
    locale,
    cleanupDirectories: [variantRoot, localeRoot],
  };
}

function assertPathSegment(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(value) || value === '.' || value === '..') {
    throw new Error('STORE_LISTING_ASSET_PATH_INVALID');
  }
}

function assertImageFilename(value: string): void {
  assertPathSegment(value);
  if (!/\.(png|jpe?g)$/i.test(value)) {
    throw new Error('STORE_LISTING_ASSET_TYPE_UNSUPPORTED');
  }
}
