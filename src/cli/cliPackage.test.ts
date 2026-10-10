import { promises as fs } from 'node:fs';

import { areCapabilitiesEqual, isCapability } from '@ankhorage/capability';
import { expect, test } from 'bun:test';

import { CAPABILITIES } from '../capabilities/index.js';

test('package exposes and registers the Deploy CLI provider', async () => {
  const packageUrl = new URL('../../package.json', import.meta.url);
  const parsed = JSON.parse(await fs.readFile(packageUrl, 'utf8')) as {
    readonly exports?: Record<string, unknown>;
    readonly ankh?: {
      readonly category?: string;
      readonly provider?: string | null;
      readonly capabilities?: readonly unknown[];
    };
  };

  expect(parsed.exports?.['./cli']).toEqual({
    types: './dist/cli/index.d.ts',
    import: './dist/cli/index.js',
    default: './dist/cli/index.js',
  });
  expect(parsed.exports?.['./capabilities']).toEqual({
    types: './dist/capabilities/index.d.ts',
    import: './dist/capabilities/index.js',
    default: './dist/capabilities/index.js',
  });
  expect(parsed.ankh?.category).toBe('deploy');
  expect(parsed.ankh?.provider).toBe('./dist/cli/index.js');
  expect(parsed.ankh?.capabilities).toHaveLength(CAPABILITIES.length);
  expect(parsed.ankh?.capabilities?.every(isCapability)).toBeTrue();

  for (const [index, capability] of CAPABILITIES.entries()) {
    const published = parsed.ankh?.capabilities?.at(index);
    expect(isCapability(published)).toBeTrue();
    if (!isCapability(published)) continue;
    expect(areCapabilitiesEqual(published, capability)).toBeTrue();
  }
});
