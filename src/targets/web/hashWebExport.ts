import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function hashWebExport(root: string): Promise<string> {
  const files = await listExportFiles(root, root);
  const hash = createHash('sha256');
  for (const file of files.sort((left, right) => left.relative.localeCompare(right.relative))) {
    const data = await fs.readFile(file.absolute);
    hash.update(`${file.relative.length}:${file.relative}\0${data.length}:`);
    hash.update(data);
    hash.update('\0');
  }
  return hash.digest('hex');
}

interface ExportFile {
  readonly absolute: string;
  readonly relative: string;
}

async function listExportFiles(root: string, directory: string): Promise<ExportFile[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files: ExportFile[] = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listExportFiles(root, absolute)));
      continue;
    }
    if (!entry.isFile()) throw new Error('Web export contains an unsupported filesystem entry.');
    files.push({ absolute, relative: path.relative(root, absolute).split(path.sep).join('/') });
  }
  return files;
}
