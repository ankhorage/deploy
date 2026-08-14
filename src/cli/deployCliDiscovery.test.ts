import path from 'node:path';

import { discoverAnkhPackages, loadProviderManifests } from '@ankhorage/ankh';
import { expect, test } from 'bun:test';

test('built Deploy CLI is discovered through normal Ankh package metadata', async () => {
  const repositoryRoot = path.resolve(import.meta.dir, '../..');
  const discovery = await discoverAnkhPackages({ cwd: repositoryRoot });
  const discovered = discovery.packages.find((item) => item.packageName === '@ankhorage/deploy');

  expect(discovered).toBeDefined();
  if (discovered === undefined) return;
  expect(discovered.source).toBe('current-package');
  expect(discovered.metadata.provider).toBe('./dist/cli/index.js');

  const loaded = await loadProviderManifests([discovered]);
  expect(loaded.diagnostics.filter((item) => item.severity === 'error')).toEqual([]);
  expect(loaded.providers).toHaveLength(1);
  expect(loaded.providers[0]?.providerModulePath.endsWith('/dist/cli/index.js')).toBeTrue();
  expect(loaded.providers[0]?.manifest.commands[0]?.path).toEqual([]);
});
