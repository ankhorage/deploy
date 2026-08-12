import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { hashWebExport } from './hashWebExport';

async function withExportFiles(
  files: Readonly<Record<string, string>>,
  run: (root: string) => Promise<void>,
): Promise<void> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ankh-web-hash-test-'));
  try {
    for (const [relative, content] of Object.entries(files)) {
      const filePath = path.join(root, relative);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    }
    await run(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('web export hash is deterministic for identical file trees', async () => {
  let first = '';
  await withExportFiles({ 'b.js': 'B', 'a/index.html': 'A' }, async (root) => {
    first = await hashWebExport(root);
  });
  await withExportFiles({ 'a/index.html': 'A', 'b.js': 'B' }, async (root) => {
    expect(await hashWebExport(root)).toBe(first);
  });
});

test('web export hash changes when exported bytes change', async () => {
  let first = '';
  await withExportFiles({ 'index.html': 'A' }, async (root) => {
    first = await hashWebExport(root);
  });
  await withExportFiles({ 'index.html': 'B' }, async (root) => {
    expect(await hashWebExport(root)).not.toBe(first);
  });
});
