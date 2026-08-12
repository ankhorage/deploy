import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface DownloadedAndroidArchive {
  readonly directory: string;
  readonly filePath: string;
}

export type AndroidArchiveDownloader = (url: string) => Promise<DownloadedAndroidArchive | null>;

export const downloadAndroidArchive: AndroidArchiveDownloader = async (url) => {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const directory = await fs.mkdtemp(path.join(tmpdir(), 'ankh-android-'));
  const filePath = path.join(directory, 'application.aab');
  try {
    await Bun.write(filePath, response);
    return { directory, filePath };
  } catch {
    await fs.rm(directory, { recursive: true, force: true });
    return null;
  }
};

export async function cleanupAndroidArchive(directory: string): Promise<void> {
  await fs.rm(directory, { recursive: true, force: true });
}
