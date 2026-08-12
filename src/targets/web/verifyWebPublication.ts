import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';
import type { DeploymentHttpProbe } from '../../runtime/http/DeploymentHttpProbe';

export async function verifyWebPublication(
  publication: WebDeploymentPublication,
  probe: DeploymentHttpProbe,
): Promise<DeploymentVerificationResult> {
  try {
    const result = await probe(publication.url);
    if (result.status < 500) return { ok: true };
  } catch {
    return verificationFailure(publication.provider);
  }
  return verificationFailure(publication.provider);
}

function verificationFailure(provider: string): DeploymentVerificationResult {
  return {
    ok: false,
    issues: [
      {
        code: 'WEB_DEPLOYMENT_UNREACHABLE',
        message: 'Published Web deployment could not be verified.',
        target: 'web',
        provider,
      },
    ],
  };
}
