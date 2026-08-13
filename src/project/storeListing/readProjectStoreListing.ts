import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';

import { createStoreListingRevision } from '../../domain/storeListing/createStoreListingRevision';
import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
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

async function readLocales(root: string): Promise<readonly StoreListingLocale[]> {
  const entries = await readListingDirectory(root);
  const files = entries
    .filter((entry) => entry.isFile() && path.extname(entry.name) === '.json')
    .sort((a, b) => a.name.localeCompare(b.name));
  const locales: StoreListingLocale[] = [];
  const seen = new Set<string>();
  for (const file of files) {
    const rawLocale = path.basename(file.name, '.json');
    assertUniqueLocale(rawLocale, seen);
    const value = await readJsonFile(path.join(root, file.name), 'Store listing locale');
    locales.push(parseStoreListingLocale(value, rawLocale));
  }
  return locales;
}

function assertUniqueLocale(rawLocale: string, seen: Set<string>): void {
  const canonical = normalizeStoreListingLocale(rawLocale);
  if (canonical === null || seen.has(canonical)) {
    throw new Error(`Duplicate or invalid store listing locale: ${rawLocale}`);
  }
  seen.add(canonical);
}

async function readListingDirectory(root: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
