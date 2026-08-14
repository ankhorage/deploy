import { removeContainedPath } from '../io/removeContainedPath';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import type { ProjectStoreListing } from './ProjectStoreListing';
import type { ProjectStoreListingAssetLocation } from './ProjectStoreListingAssetLocation';
import { readProjectStoreListing } from './readProjectStoreListing';
import { removeEmptyStoreListingDirectories } from './removeEmptyStoreListingDirectories';
import { resolveProjectStoreListingAssetLocation } from './resolveProjectStoreListingAssetLocation';

export async function removeProjectStoreListingAsset(options: {
  readonly projectRoot: string;
  readonly location: ProjectStoreListingAssetLocation;
}): Promise<ProjectStoreListing> {
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  const resolved = resolveProjectStoreListingAssetLocation(paths, options.location);
  await removeContainedPath({
    projectRoot: paths.projectRoot,
    targetPath: resolved.filePath,
  });
  await removeEmptyStoreListingDirectories(paths.projectRoot, resolved.cleanupDirectories);
  return readProjectStoreListing({ projectRoot: paths.projectRoot });
}
