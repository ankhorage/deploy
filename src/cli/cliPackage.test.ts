import { promises as fs } from 'node:fs';

import { expect, test } from 'bun:test';

test('package exposes and registers the Deploy CLI provider', async () => {
  const packageUrl = new URL('../../package.json', import.meta.url);
  const parsed = JSON.parse(await fs.readFile(packageUrl, 'utf8')) as {
    readonly exports?: Record<string, unknown>;
    readonly ankh?: {
      readonly category?: string;
      readonly provider?: string | null;
      readonly capabilities?: readonly string[];
    };
  };

  expect(parsed.exports?.['./cli']).toEqual({
    types: './dist/cli/index.d.ts',
    import: './dist/cli/index.js',
    default: './dist/cli/index.js',
  });
  expect(parsed.ankh).toEqual({
    category: 'deploy',
    provider: './dist/cli/index.js',
    capabilities: ['deploy.inspect', 'deploy.plan', 'deploy.execute'],
  });
});
