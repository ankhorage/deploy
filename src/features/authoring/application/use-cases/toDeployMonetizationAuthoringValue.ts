import type { MonetizationProduct } from '../../../../domain/monetization/MonetizationProduct';
import type {
  DeployMonetizationAuthoringValue,
  DeployMonetizationProductAuthoringValue,
} from '../../../../types/deployAuthoring';
import { createDeployAuthoringRegistry } from '../../utils/createDeployAuthoringRegistry';

/*** Project canonical Deploy monetization products into stable product/localization registries for authoring. */
export function toDeployMonetizationAuthoringValue(
  products: readonly MonetizationProduct[],
): DeployMonetizationAuthoringValue {
  return {
    products: createDeployAuthoringRegistry(
      products.map((product) => [product.id, toAuthoringProduct(product)] as const),
    ),
  };
}

/*** Project one canonical product while making its kind-dependent subscription shape explicit. */
function toAuthoringProduct(product: MonetizationProduct): DeployMonetizationProductAuthoringValue {
  const base = {
    id: product.id,
    basePrice: product.basePrice,
    localizations: createDeployAuthoringRegistry(
      product.localizations.map((localization) => [localization.locale, localization] as const),
    ),
  };

  if (product.kind === 'subscription') {
    if (product.subscription === undefined) throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
    return { ...base, kind: 'subscription', subscription: product.subscription };
  }
  if (product.subscription !== undefined) throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
  return { ...base, kind: product.kind };
}
