import path from 'node:path';

import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { atomicWriteJson } from '../io/atomicWriteJson';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { parseStoreListingLocale } from './parseStoreListingLocale';
import type { ProjectStoreListing } from './ProjectStoreListing';
import { readProjectStoreListing } from './readProjectStoreListing';

export async function writeProjectStoreListingLocale(options: {
  readonly projectRoot: string;
  readonly locale: StoreListingLocale;
}): Promise<ProjectStoreListing> {
  const normalized = parseStoreListingLocale(options.locale, options.locale.locale);
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  await atomicWriteJson({
    projectRoot: paths.projectRoot,
    filePath: path.join(paths.listingRoot, `${normalized.locale}.json`),
    value: normalized,
  });
  return readProjectStoreListing({ projectRoot: paths.projectRoot });
}
