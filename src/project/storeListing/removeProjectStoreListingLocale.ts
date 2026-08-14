import path from 'node:path';

import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import { removeContainedPath } from '../io/removeContainedPath';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import type { ProjectStoreListing } from './ProjectStoreListing';
import { readProjectStoreListing } from './readProjectStoreListing';

export async function removeProjectStoreListingLocale(options: {
  readonly projectRoot: string;
  readonly locale: string;
}): Promise<ProjectStoreListing> {
  const locale = normalizeStoreListingLocale(options.locale);
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  await Promise.all([
    removeContainedPath({
      projectRoot: paths.projectRoot,
      targetPath: path.join(paths.listingRoot, `${locale}.json`),
    }),
    removeContainedPath({
      projectRoot: paths.projectRoot,
      targetPath: path.join(paths.androidScreenshotsRoot, locale),
      recursive: true,
    }),
    removeContainedPath({
      projectRoot: paths.projectRoot,
      targetPath: path.join(paths.iosScreenshotsRoot, locale),
      recursive: true,
    }),
  ]);
  return readProjectStoreListing({ projectRoot: paths.projectRoot });
}
