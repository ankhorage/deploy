import { atomicWriteFile } from '../io/atomicWriteFile';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { assertStoreListingAssetBytes } from './assertStoreListingAssetBytes';
import { assertStoreListingAssetLocale } from './assertStoreListingAssetLocale';
import type { ProjectStoreListing } from './ProjectStoreListing';
import type { ProjectStoreListingAssetLocation } from './ProjectStoreListingAssetLocation';
import { readProjectStoreListing } from './readProjectStoreListing';
import { resolveProjectStoreListingAssetLocation } from './resolveProjectStoreListingAssetLocation';

export async function writeProjectStoreListingAsset(options: {
  readonly projectRoot: string;
  readonly location: ProjectStoreListingAssetLocation;
  readonly data: Uint8Array;
}): Promise<ProjectStoreListing> {
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  const resolved = resolveProjectStoreListingAssetLocation(paths, options.location);
  if (resolved.locale !== undefined) {
    await assertStoreListingAssetLocale(paths.listingRoot, resolved.locale);
  }
  assertStoreListingAssetBytes(resolved.filename, options.data);
  await atomicWriteFile({
    projectRoot: paths.projectRoot,
    filePath: resolved.filePath,
    data: options.data,
  });
  return readProjectStoreListing({ projectRoot: paths.projectRoot });
}
