import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import { atomicWriteJson } from '../io/atomicWriteJson';
import { resolveProjectDeploymentPaths } from '../resolveProjectDeploymentPaths';
import { parseProjectMonetization } from './parseProjectMonetization';
import { readProjectMonetization } from './readProjectMonetization';

export async function writeProjectMonetization(options: {
  readonly projectRoot: string;
  readonly products: readonly MonetizationProduct[];
}): Promise<MonetizationDesiredState> {
  const products = parseProjectMonetization({ products: options.products });
  const paths = resolveProjectDeploymentPaths(options.projectRoot);
  await atomicWriteJson({
    projectRoot: paths.projectRoot,
    filePath: paths.productsPath,
    value: { products },
  });
  return readProjectMonetization({ projectRoot: paths.projectRoot });
}
