import path from 'node:path';

import {
  ANDROID_DEPLOYMENT_TRACKS,
  type AndroidDeploymentTrack,
} from '../domain/AndroidDeploymentIntent.js';
import type { DeployCliOptions } from './DeployCliOptions.js';

const BOOLEAN_FLAGS = new Set(['--dry-run', '--yes', '--json']);
const VALUE_FLAGS = new Set([
  '--project-root',
  '--execution-id',
  '--android-track',
  '--android-build-profile',
  '--ios-build-profile',
  '--web-alias',
  '--web-environment',
]);

type ParseResult =
  | { readonly ok: true; readonly options: DeployCliOptions }
  | { readonly ok: false; readonly message: string };

interface DraftOptions {
  projectRoot: string;
  dryRun: boolean;
  yes: boolean;
  format: 'human' | 'json';
  executionId?: string;
  androidTrack?: AndroidDeploymentTrack;
  androidBuildProfile?: string;
  iosBuildProfile?: string;
  webAlias?: string;
  webEnvironment?: string;
}

export function parseDeployCliOptions(argv: readonly string[], cwd: string): ParseResult {
  const draft: DraftOptions = {
    projectRoot: path.resolve(cwd),
    dryRun: false,
    yes: false,
    format: 'human',
  };
  const seen = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv.at(index);
    if (token === undefined) continue;
    const duplicate = markSeen(seen, token);
    if (duplicate !== null) return failure(duplicate);
    if (BOOLEAN_FLAGS.has(token)) {
      applyBooleanFlag(draft, token);
      continue;
    }
    if (!VALUE_FLAGS.has(token)) return failure(`Unknown deploy option: ${token}`);
    const value = argv.at(index + 1);
    if (value === undefined || value.startsWith('--')) {
      return failure(`Deploy option ${token} requires a value.`);
    }
    const error = applyValueFlag(draft, token, value, cwd);
    if (error !== null) return failure(error);
    index += 1;
  }

  if (draft.androidBuildProfile !== undefined && draft.androidTrack === undefined) {
    return failure('--android-build-profile requires --android-track.');
  }
  return { ok: true, options: draft };
}

function markSeen(seen: Set<string>, token: string): string | null {
  if (!token.startsWith('--')) return null;
  if (seen.has(token)) return `Deploy option ${token} may only be provided once.`;
  seen.add(token);
  return null;
}

function applyBooleanFlag(draft: DraftOptions, flag: string): void {
  if (flag === '--dry-run') draft.dryRun = true;
  if (flag === '--yes') draft.yes = true;
  if (flag === '--json') draft.format = 'json';
}

function applyValueFlag(
  draft: DraftOptions,
  flag: string,
  value: string,
  cwd: string,
): string | null {
  if (flag === '--project-root') draft.projectRoot = path.resolve(cwd, value);
  if (flag === '--execution-id') draft.executionId = value;
  if (flag === '--android-track') {
    if (!isAndroidDeploymentTrack(value)) return invalidAndroidTrack(value);
    draft.androidTrack = value;
  }
  if (flag === '--android-build-profile') draft.androidBuildProfile = value;
  if (flag === '--ios-build-profile') draft.iosBuildProfile = value;
  if (flag === '--web-alias') draft.webAlias = value;
  if (flag === '--web-environment') draft.webEnvironment = value;
  return null;
}

function isAndroidDeploymentTrack(value: string): value is AndroidDeploymentTrack {
  return ANDROID_DEPLOYMENT_TRACKS.some((track) => track === value);
}

function invalidAndroidTrack(value: string): string {
  return `Invalid Android track: ${value}. Expected one of: ${ANDROID_DEPLOYMENT_TRACKS.join(', ')}.`;
}

function failure(message: string): { readonly ok: false; readonly message: string } {
  return { ok: false, message };
}
