import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import { createStoreListingRevision } from '../../domain/storeListing/createStoreListingRevision';
import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import { readJsonFile } from '../io/readJsonFile';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { discoverStoreListingAssets } from './discoverStoreListingAssets';
import { parseStoreListingLocale } from './parseStoreListingLocale';

export async function readProjectStoreListing(projectRoot: string): Promise<StoreListingDesiredState> {
  const paths = resolveProjectDeploymentPaths(projectRoot);
  const locales = await readLocales(paths.listingRoot);
  const assets = await discoverStoreListingAssets(paths);
  return { locales, assets, revision: createStoreListingRevision({ locales, assets }) };
}

async function readLocales(root: string) {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  const files = entries.filter((entry) => entry.isFile() && path.extname(entry.name) === '.json').toSorted((a, b) => a.name.localeCompare(b.name));
  const locales = [];
  const seen = new Set<string>();
  for (const file of files) {
    const rawLocale = path.basename(file.name, '.json');
    const canonical = normalizeStoreListingLocale(rawLocale);
    if (canonical === null || seen.has(canonical)) throw new Error(`Duplicate or invalid store listing locale: ${rawLocale}`);
    seen.add(canonical);
    locales.push(parseStoreListingLocale(await readJsonFile(path.join(root, file.name)), rawLocale));
  }
  return locales;
}

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
