import { expect, test } from 'bun:test';

import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import { inspectAppStoreMonetization } from './inspectAppStoreMonetization';
import { toAppStoreTerritoryCode } from './toAppStoreTerritoryCode';

const ACCESS = {
  credentials: [{ provider: 'app-store-connect', id: 'key', kind: 'api-key' }] as const,
  resolveSecret: () =>
    Promise.resolve(
      JSON.stringify({ keyId: 'KEY', issuerId: 'ISSUER', privateKey: 'PRIVATE_KEY_SENTINEL' }),
    ),
  createToken: () => Promise.resolve('token'),
  now: new Date('2026-08-13T12:00:00Z'),
} as const;

const DESIRED: MonetizationDesiredState = {
  revision: 'desired',
  products: [
    {
      id: 'premium.unlock',
      kind: 'non-consumable',
      localizations: [{ locale: 'en-US', name: 'Premium', description: 'Unlock premium' }],
      basePrice: { country: 'US', currency: 'USD', amount: '4.99' },
    },
    {
      id: 'pro.monthly',
      kind: 'subscription',
      localizations: [{ locale: 'en-US', name: 'Pro', description: 'Monthly Pro' }],
      basePrice: { country: 'US', currency: 'USD', amount: '9.99' },
      subscription: { family: 'pro', period: 'P1M', level: 1 },
    },
  ],
};

test('App Store monetization inspection normalizes IAPs and subscriptions', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const result = await inspectAppStoreMonetization({
    bundleIdentifier: 'com.example.app',
    desired: DESIRED,
    request: transport(requests),
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  expect(result.state.products.map((item) => [item.id, item.kind])).toEqual([
    ['premium.unlock', 'non-consumable'],
    ['pro.monthly', 'subscription'],
  ]);
  expect(result.state.products[0]?.basePrice?.amount).toBe('4.99');
  expect(result.state.products[1]?.subscription).toEqual({
    family: 'pro',
    period: 'P1M',
    level: 1,
  });
  expect(result.state.subscriptionFamilies).toEqual(['pro']);
  expect(result.state.diagnostics).toEqual([]);
  expect(requests.some((request) => request.url.includes('/inAppPurchasesV2'))).toBe(true);
});

test('App Store locked subscription period blocks the canonical plan', async () => {
  const result = await inspectAppStoreMonetization({
    bundleIdentifier: 'com.example.app',
    desired: DESIRED,
    request: transport([], 'ONE_YEAR', 'APPROVED'),
    ...ACCESS,
  });
  if (result.status !== 'completed') throw new Error('Expected App Store inspection.');
  const plan = createMonetizationPlan({
    desired: DESIRED,
    currentRevision: createMonetizationCurrentRevision([result.state]),
    states: [result.state],
  });
  expect(plan.status).toBe('blocked');
  expect(plan.diagnostics.map((item) => item.code)).toContain(
    'APP_STORE_SUBSCRIPTION_PERIOD_LOCKED',
  );
});

test('App Store territory conversion maps canonical alpha-2 codes', () => {
  expect(toAppStoreTerritoryCode('US')).toBe('USA');
  expect(toAppStoreTerritoryCode('CH')).toBe('CHE');
});

function transport(
  requests: AppStoreConnectRequest[],
  period = 'ONE_MONTH',
  subscriptionState = 'READY_TO_SUBMIT',
): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(responseFor(request.url, period, subscriptionState));
  };
}

function responseFor(
  url: string,
  period: string,
  subscriptionState: string,
): { status: number; body: string } {
  if (url.includes('/apps?')) return ok(appResponse());
  if (url.includes('/inAppPurchasesV2?')) return ok(iapCatalog());
  if (url.includes('/subscriptionGroups?'))
    return ok(subscriptionCatalog(period, subscriptionState));
  if (url.includes('/inAppPurchases/iap-1/inAppPurchaseLocalizations')) {
    return ok(localizations('iap-localization'));
  }
  if (url.includes('/subscriptions/sub-1/subscriptionLocalizations')) {
    return ok(localizations('sub-localization'));
  }
  if (url.includes('/inAppPurchases/iap-1/pricePoints'))
    return ok(pricePoints('iap-point', '4.99'));
  if (url.includes('/subscriptions/sub-1/pricePoints')) return ok(pricePoints('sub-point', '9.99'));
  if (url.includes('/inAppPurchases/iap-1/iapPriceSchedule')) return ok(iapSchedule());
  if (url.includes('/subscriptions/sub-1/prices')) return ok(subscriptionPrices());
  return { status: 404, body: '{}' };
}

function appResponse(): unknown {
  return {
    data: [{ type: 'apps', id: 'app-1', attributes: { bundleId: 'com.example.app' } }],
  };
}

function iapCatalog(): unknown {
  return {
    data: [
      {
        type: 'inAppPurchases',
        id: 'iap-1',
        attributes: {
          productId: 'premium.unlock',
          inAppPurchaseType: 'NON_CONSUMABLE',
          state: 'READY_TO_SUBMIT',
        },
      },
    ],
  };
}

function subscriptionCatalog(period: string, state: string): unknown {
  return {
    data: [
      {
        type: 'subscriptionGroups',
        id: 'group-1',
        attributes: { referenceName: 'pro' },
      },
    ],
    included: [
      {
        type: 'subscriptions',
        id: 'sub-1',
        attributes: {
          productId: 'pro.monthly',
          subscriptionPeriod: period,
          groupLevel: 1,
          state,
        },
        relationships: {
          group: { data: { type: 'subscriptionGroups', id: 'group-1' } },
        },
      },
    ],
  };
}

function localizations(id: string): unknown {
  return {
    data: [
      {
        type: 'localization',
        id,
        attributes: {
          locale: 'en-US',
          name: id.startsWith('iap') ? 'Premium' : 'Pro',
          description: id.startsWith('iap') ? 'Unlock premium' : 'Monthly Pro',
        },
      },
    ],
  };
}

function pricePoints(id: string, amount: string): unknown {
  return {
    data: [
      {
        type: 'pricePoint',
        id,
        attributes: { customerPrice: amount },
        relationships: { territory: { data: { type: 'territories', id: 'USA' } } },
      },
    ],
    included: [{ type: 'territories', id: 'USA', attributes: { currency: 'USD' } }],
  };
}

function iapSchedule(): unknown {
  return {
    data: {
      type: 'inAppPurchasePriceSchedules',
      id: 'schedule-1',
      relationships: {
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
      },
    },
    included: [
      {
        type: 'inAppPurchasePrices',
        id: 'iap-price',
        attributes: { startDate: null, endDate: null },
        relationships: {
          inAppPurchasePricePoint: {
            data: { type: 'inAppPurchasePricePoints', id: 'iap-point' },
          },
        },
      },
    ],
  };
}

function subscriptionPrices(): unknown {
  return {
    data: [
      {
        type: 'subscriptionPrices',
        id: 'sub-price',
        attributes: { startDate: null, planType: 'MONTHLY' },
        relationships: {
          territory: { data: { type: 'territories', id: 'USA' } },
          subscriptionPricePoint: {
            data: { type: 'subscriptionPricePoints', id: 'sub-point' },
          },
        },
      },
    ],
  };
}

function ok(value: unknown): { status: number; body: string } {
  return { status: 200, body: JSON.stringify(value) };
}
