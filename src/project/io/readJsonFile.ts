import { promises as fs } from 'node:fs';

export async function readJsonFile(filePath: string, label: string): Promise<unknown> {
  const raw = await fs.readFile(filePath, 'utf8');

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${filePath}`, { cause: error });
  }
}
