import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

export interface DownloadedIosArchive {
  readonly directory: string;
  readonly filePath: string;
}

export type IosArchiveDownloader = (url: string) => Promise<DownloadedIosArchive | null>;

export const downloadIosArchive: IosArchiveDownloader = async (url) => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'ankh-ios-'));
  const filePath = path.join(directory, 'application.ipa');
  try {
    await Bun.write(filePath, response);
    return { directory, filePath };
  } catch {
    await fs.rm(directory, { recursive: true, force: true });
    return null;
  }
};

export async function cleanupIosArchive(directory: string): Promise<void> {
  await fs.rm(directory, { recursive: true, force: true });
}
