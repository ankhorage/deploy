import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import { isMissingPathError } from '../io/isMissingPathError';
import { readJsonFile } from '../io/readJsonFile';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { createProjectMonetizationRevision } from './createProjectMonetizationRevision';
import { parseProjectMonetization } from './parseProjectMonetization';

export async function readProjectMonetization(options: {
  readonly projectRoot: string;
}): Promise<MonetizationDesiredState> {
  const { productsPath } = resolveProjectDeploymentPaths(options.projectRoot);
  let products;
  try {
    products = parseProjectMonetization(
      await readJsonFile(productsPath, 'Deploy monetization products'),
    );
  } catch (error) {
    if (!isMissingPathError(error)) throw error;
    products = [];
  }
  return { products, revision: createProjectMonetizationRevision(products) };
}
