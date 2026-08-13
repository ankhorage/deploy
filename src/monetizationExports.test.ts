import { expect, test } from 'bun:test';

import type {
  MonetizationBasePrice,
  MonetizationDesiredState,
  MonetizationLocalization,
  MonetizationPlan,
  MonetizationPlanStep,
  MonetizationProduct,
  MonetizationProductKind,
  MonetizationSubscription,
  MonetizationSubscriptionPeriod,
  MonetizationTargetState,
} from './index.js';

test('root entrypoint exposes the canonical monetization domain types', () => {
  const localization: MonetizationLocalization = {
    locale: 'en-US',
    name: 'Premium',
    description: 'Unlock premium',
  };
  const price: MonetizationBasePrice = { country: 'US', currency: 'USD', amount: '4.99' };
  const kind: MonetizationProductKind = 'non-consumable';
  const period: MonetizationSubscriptionPeriod = 'P1M';
  const subscription: MonetizationSubscription = { family: 'pro', period };
  const product: MonetizationProduct = {
    id: 'premium.unlock',
    kind,
    localizations: [localization],
    basePrice: price,
  };
  const desired: MonetizationDesiredState = { revision: 'desired', products: [product] };
  const step: MonetizationPlanStep = {
    id: 'ios:premium.unlock:update-price',
    target: 'ios',
    productId: product.id,
    operation: 'update-price',
  };
  const plan: MonetizationPlan = {
    status: 'changes',
    desiredRevision: desired.revision,
    currentRevision: 'current',
    steps: [step],
    diagnostics: [],
  };
  const state: MonetizationTargetState = {
    target: 'ios',
    products: [],
    subscriptionFamilies: [subscription.family],
    diagnostics: [],
  };
  expect([plan.status, state.target, product.kind, period]).toEqual([
    'changes',
    'ios',
    'non-consumable',
    'P1M',
  ]);
});
