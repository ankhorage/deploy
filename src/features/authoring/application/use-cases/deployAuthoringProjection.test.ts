import { expect, test } from 'bun:test';

import type { MonetizationProduct } from '../../../../domain/monetization/MonetizationProduct';
import type { ProjectReleaseInput } from '../../../../project/release/ProjectReleaseInput';
import type { DeployMonetizationAuthoringValue } from '../../../../types/deployAuthoring';
import { fromDeployMonetizationAuthoringValue } from './fromDeployMonetizationAuthoringValue';
import { fromDeployReleaseAuthoringValue } from './fromDeployReleaseAuthoringValue';
import { toDeployMonetizationAuthoringValue } from './toDeployMonetizationAuthoringValue';
import { toDeployReleaseAuthoringValue } from './toDeployReleaseAuthoringValue';

test('round-trips monetization through stable product and localization identity', () => {
  const products: readonly MonetizationProduct[] = [
    {
      id: 'pro.yearly',
      kind: 'subscription',
      localizations: [
        { locale: 'de-CH', name: 'Pro', description: 'Jährlich' },
        { locale: 'en-US', name: 'Pro', description: 'Yearly' },
      ],
      basePrice: { country: 'CH', currency: 'CHF', amount: '19.9' },
      subscription: { family: 'pro', period: 'P1Y' },
    },
    {
      id: 'coins',
      kind: 'consumable',
      localizations: [{ locale: 'en-US', name: 'Coins', description: 'Coin pack' }],
      basePrice: { country: 'US', currency: 'USD', amount: '1.99' },
    },
  ];

  const authored = toDeployMonetizationAuthoringValue(products);

  expect(Object.keys(authored.products)).toEqual(['pro.yearly', 'coins']);
  expect(Object.keys(authored.products['pro.yearly']?.localizations ?? {})).toEqual([
    'de-CH',
    'en-US',
  ]);
  expect(fromDeployMonetizationAuthoringValue(authored).map((product) => product.id)).toEqual([
    'coins',
    'pro.yearly',
  ]);
});

test('rejects monetization registry keys that disagree with owner identity', () => {
  const value: DeployMonetizationAuthoringValue = {
    products: {
      wrong: {
        id: 'actual',
        kind: 'consumable',
        localizations: {
          'en-US': { locale: 'en-US', name: 'Actual', description: 'Mismatch' },
        },
        basePrice: { country: 'US', currency: 'USD', amount: '1' },
      },
    },
  };

  expect(() => fromDeployMonetizationAuthoringValue(value)).toThrow(
    'DEPLOY_AUTHORING_VALUE_INVALID',
  );
});

test('round-trips releases through target membership and locale-keyed notes', () => {
  const release: ProjectReleaseInput = {
    version: '2.1.0',
    targets: ['web', 'android'],
    notes: [
      { locale: 'de-CH', text: 'Neu' },
      { locale: 'en-US', text: 'New' },
    ],
    rollout: {
      web: { mode: 'immediate' },
      android: { mode: 'staged', initialFraction: '0.25' },
    },
  };

  const authored = toDeployReleaseAuthoringValue(release);

  expect(authored.targets).toEqual({ web: true, android: true });
  expect(Object.keys(authored.notes)).toEqual(['de-CH', 'en-US']);
  expect(fromDeployReleaseAuthoringValue(authored)).toEqual({
    ...release,
    targets: ['android', 'web'],
  });
});

test('rejects release-note registry keys that disagree with locale identity', () => {
  const authored = toDeployReleaseAuthoringValue({
    version: '1.0.0',
    targets: ['web'],
    notes: [{ locale: 'en-US', text: 'Release' }],
    rollout: { web: { mode: 'immediate' } },
  });
  const value = {
    ...authored,
    notes: { wrong: authored.notes['en-US']! },
  };

  expect(() => fromDeployReleaseAuthoringValue(value)).toThrow('DEPLOY_AUTHORING_VALUE_INVALID');
});
