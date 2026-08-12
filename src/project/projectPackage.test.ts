import { expect, test } from 'bun:test';
import { promises as fs } from 'node:fs';

test('package exposes the dedicated project subpath', async () => {
  const packageUrl = new URL('../../package.json', import.meta.url);
  const parsed = JSON.parse(await fs.readFile(packageUrl, 'utf8')) as {
    readonly exports?: Record<string, unknown>;
  };

  expect(parsed.exports?.['./project']).toEqual({
    types: './dist/project/index.d.ts',
    import: './dist/project/index.js',
    default: './dist/project/index.js',
  });
});
