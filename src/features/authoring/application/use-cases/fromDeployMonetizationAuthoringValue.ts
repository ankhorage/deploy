import type { MonetizationProduct } from '../../../../domain/monetization/MonetizationProduct';
import { parseProjectMonetization } from '../../../../project/monetization/parseProjectMonetization';
import type { DeployMonetizationAuthoringValue } from '../../../../types/deployAuthoring';
import { readDeployAuthoringRegistryValues } from '../../utils/readDeployAuthoringRegistryValues';

/*** Convert authored registries back through Deploy's canonical monetization parser and validation. */
export function fromDeployMonetizationAuthoringValue(
  value: DeployMonetizationAuthoringValue,
): readonly MonetizationProduct[] {
  const products = readDeployAuthoringRegistryValues(value.products, (product) => product.id).map(
    (product) => ({
      ...product,
      localizations: readDeployAuthoringRegistryValues(
        product.localizations,
        (localization) => localization.locale,
      ),
    }),
  );
  return parseProjectMonetization({ products });
}
