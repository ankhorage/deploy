import { expect, test } from 'bun:test';

import { createMonetizationCurrentRevision } from './createMonetizationCurrentRevision';
import { createMonetizationPlan } from './createMonetizationPlan';
import type { MonetizationDesiredState } from './MonetizationDesiredState';
import type { MonetizationTargetState } from './MonetizationTargetState';

const desired: MonetizationDesiredState = {
  revision: 'desired',
  products: [
    {
      id: 'pro.monthly',
      kind: 'subscription',
      localizations: [{ locale: 'en-US', name: 'Pro', description: 'Pro access' }],
      basePrice: { country: 'US', currency: 'USD', amount: '4.99' },
      subscription: { family: 'pro', period: 'P1M', level: 1 },
    },
  ],
};

const android: MonetizationTargetState = {
  target: 'android',
  products: desired.products,
  subscriptionFamilies: [],
  diagnostics: [],
};

const ios: MonetizationTargetState = {
  target: 'ios',
  products: [],
  subscriptionFamilies: [],
  diagnostics: [],
};

test('matching monetization state plans no changes', () => {
  const currentRevision = createMonetizationCurrentRevision([android]);
  const plan = createMonetizationPlan({ desired, currentRevision, states: [android] });
  expect(currentRevision).toHaveLength(64);
  expect(plan.status).toBe('no-change');
  expect(plan.steps).toEqual([]);
});

test('iOS subscription creation ensures family before product', () => {
  const plan = createMonetizationPlan({ desired, currentRevision: 'current', states: [ios] });
  expect(plan.steps.map((step) => step.operation)).toEqual([
    'ensure-subscription-family',
    'create-product',
  ]);
});

test('incompatible existing product kind blocks the plan', () => {
  const [product] = desired.products;
  if (product === undefined) throw new Error('Expected monetization product fixture.');
  const state = {
    ...ios,
    products: [{ ...product, kind: 'non-consumable' }],
  } as const;
  const plan = createMonetizationPlan({ desired, currentRevision: 'current', states: [state] });
  expect(plan.status).toBe('blocked');
  expect(plan.diagnostics[0]?.code).toBe('MONETIZATION_PRODUCT_KIND_CONFLICT');
});
