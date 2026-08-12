import { atomicWriteFile } from './atomicWriteFile';

export async function atomicWriteJson(options: {
  readonly projectRoot: string;
  readonly filePath: string;
  readonly value: unknown;
}): Promise<void> {
  const data = `${JSON.stringify(options.value, null, 2)}\n`;
  await atomicWriteFile({
    projectRoot: options.projectRoot,
    filePath: options.filePath,
    data,
  });
}
