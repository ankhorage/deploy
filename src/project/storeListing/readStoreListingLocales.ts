import { promises as fs, type Dirent } from 'node:fs';
import path from 'node:path';

import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { isMissingPathError } from '../io/isMissingPathError';
import { parseStoreListingLocale } from './parseStoreListingLocale';

export async function readStoreListingLocales(root: string): Promise<readonly StoreListingLocale[]> {
  const entries = await readEntries(root);
  const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  const locales = await Promise.all(files.map((entry) => readLocale(root, entry.name)));
  const sorted = locales.sort((a, b) => a.locale.localeCompare(b.locale));
  assertUniqueLocales(sorted);
  return sorted;
}

async function readEntries(root: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissingPathError(error)) return [];
    throw error;
  }
}

async function readLocale(root: string, filename: string): Promise<StoreListingLocale> {
  const filenameLocale = filename.slice(0, -'.json'.length);
  const content = await fs.readFile(path.join(root, filename), 'utf8');
  let value: unknown;
  try {
    value = JSON.parse(content) as unknown;
  } catch {
    throw new Error('STORE_LISTING_JSON_INVALID');
  }
  return parseStoreListingLocale(value, filenameLocale);
}

function assertUniqueLocales(locales: readonly StoreListingLocale[]): void {
  const seen = new Set<string>();
  for (const locale of locales) {
    if (seen.has(locale.locale)) throw new Error('STORE_LISTING_LOCALE_DUPLICATE');
    seen.add(locale.locale);
  }
}
