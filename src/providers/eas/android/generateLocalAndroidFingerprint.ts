import type { DeploymentFailure } from '../../../domain/DeploymentFailure';
import type { DeploymentProcessRunner } from '../../../runtime/process/DeploymentProcessRunner';

export type LocalAndroidFingerprintResult =
  | { readonly status: 'completed'; readonly fingerprint: string }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

const FINGERPRINT_SCRIPT = `
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as Fingerprint from 'expo/fingerprint';
const markers = ['android/app/build.gradle', 'android/app/src/main/AndroidManifest.xml'];
const generic = markers.some((marker) => {
  if (!existsSync(marker)) return false;
  return spawnSync('git', ['check-ignore', '--quiet', marker], { cwd: process.cwd() }).status !== 0;
});
const options = { platforms: ['android'], silent: true, ...(generic ? {} : { ignorePaths: ['android/**/*', 'ios/**/*'] }) };
const result = await Fingerprint.createFingerprintAsync(process.cwd(), options);
process.stdout.write(JSON.stringify({ hash: result.hash }));
`;

export async function generateLocalAndroidFingerprint(options: {
  readonly projectRoot: string;
  readonly profileEnvironment: Readonly<Record<string, string>>;
  readonly runProcess: DeploymentProcessRunner;
}): Promise<LocalAndroidFingerprintResult> {
  const result = await options.runProcess({
    command: 'node',
    args: ['--input-type=module', '--eval', FINGERPRINT_SCRIPT],
    cwd: options.projectRoot,
    env: options.profileEnvironment,
  });
  if (result.exitCode !== 0) return failure();
  let parsed: unknown;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    return failure();
  }
  if (!isFingerprintResult(parsed)) return failure();
  return { status: 'completed', fingerprint: parsed.hash };
}

function isFingerprintResult(value: unknown): value is { readonly hash: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const hash = (value as Record<string, unknown>).hash;
  return typeof hash === 'string' && /^[a-f\d]{32,128}$/i.test(hash);
}

function failure(): LocalAndroidFingerprintResult {
  return {
    status: 'failed',
    failure: {
      code: 'ANDROID_FINGERPRINT_FAILED',
      message: 'Android project fingerprint could not be generated.',
      target: 'android',
      provider: 'eas',
    },
  };
}
