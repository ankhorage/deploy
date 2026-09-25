import { isStructureDescriptorDocument } from '@ankhorage/contracts/structure';
import { expect, test } from 'bun:test';

import { DEPLOY_AUTHORING_STRUCTURE } from './deployAuthoringStructure';

test('publishes a valid Deploy-owned structure document for every Studio-authored input', () => {
  expect(isStructureDescriptorDocument(DEPLOY_AUTHORING_STRUCTURE)).toBe(true);
  expect(DEPLOY_AUTHORING_STRUCTURE.packageName).toBe('@ankhorage/deploy');
  expect(DEPLOY_AUTHORING_STRUCTURE.roots).toEqual({
    monetization: 'DeployMonetizationAuthoringValue',
    'prepared-release': 'DeployReleaseAuthoringValue',
    'store-listing-asset-location': 'ProjectStoreListingAssetLocation',
    'store-listing-locale': 'StoreListingLocale',
  });
});

test('preserves stable identity and discriminated monetization semantics', () => {
  const monetization =
    DEPLOY_AUTHORING_STRUCTURE.descriptors.DeployMonetizationAuthoringValue.descriptor;
  const products = monetization.fields.products.value;
  const product =
    DEPLOY_AUTHORING_STRUCTURE.descriptors.DeployMonetizationProductAuthoringValue.descriptor;

  expect(products.kind).toBe('entity-registry');
  expect(products.identityField).toBe('id');
  expect(product.kind).toBe('union');
  expect(product.discriminator).toBe('kind');
  expect(product.variants).toHaveLength(3);

  const subscription = product.variants.at(2);
  expect(subscription).toMatchObject({
    kind: 'object',
    fields: {
      kind: { value: { kind: 'enum', values: ['subscription'] } },
      subscription: { value: { kind: 'ref', id: 'MonetizationSubscription' } },
    },
  });
});

test('publishes release set/registry semantics and real discriminated rollout variants', () => {
  const release = DEPLOY_AUTHORING_STRUCTURE.descriptors.DeployReleaseAuthoringValue.descriptor;
  const rollout = DEPLOY_AUTHORING_STRUCTURE.descriptors.DeployReleaseAuthoringRollout.descriptor;

  expect(release.fields.targets.value).toEqual({
    kind: 'set',
    member: { kind: 'enum', values: ['android', 'ios', 'web'] },
  });
  expect(release.fields.notes.value).toMatchObject({
    kind: 'entity-registry',
    identityField: 'locale',
  });
  expect(rollout.fields.android.value).toMatchObject({
    kind: 'union',
    discriminator: 'mode',
  });
});

test('publishes direct locale authoring and a discriminated semantic asset location', () => {
  const locale = DEPLOY_AUTHORING_STRUCTURE.descriptors.StoreListingLocale.descriptor;
  const asset =
    DEPLOY_AUTHORING_STRUCTURE.descriptors.ProjectStoreListingAssetLocation.descriptor;

  expect(locale.fields.keywords).toEqual({
    value: { kind: 'ordered-list', item: { kind: 'scalar', type: 'string' } },
    optional: true,
  });
  expect(asset.kind).toBe('union');
  expect(asset.discriminator).toBe('kind');
  expect(asset.variants).toHaveLength(2);
});
