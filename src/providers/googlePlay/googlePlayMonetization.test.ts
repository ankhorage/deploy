import { expect, test } from 'bun:test';

import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import { executeGooglePlayMonetizationPlan } from './executeGooglePlayMonetizationPlan';
import type { GooglePlayRequest, GooglePlayTransport } from './GooglePlayTransport';
import { inspectGooglePlayMonetization } from './inspectGooglePlayMonetization';
import { writeGooglePlayMonetizationProduct } from './writeGooglePlayMonetizationProduct';

const CREDENTIAL = { provider: 'google-play', id: 'publisher', kind: 'service-account' } as const;
const SECRET = JSON.stringify({
  type: 'service_account',
  client_email: 'robot@example.test',
  private_key: 'PRIVATE_KEY_SENTINEL',
});
const ACCESS = {
  credentials: [CREDENTIAL],
  resolveSecret: () => Promise.resolve(SECRET),
  createToken: () => Promise.resolve('token'),
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

test('Google Play monetization inspection normalizes authored products', async () => {
  const requests: GooglePlayRequest[] = [];
  const result = await inspectGooglePlayMonetization({
    packageName: 'com.example.app',
    desired: DESIRED,
    request: inspectionTransport(requests),
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  expect(result.state.products.map((product) => [product.id, product.kind])).toEqual([
    ['premium.unlock', 'one-time'],
    ['pro.monthly', 'subscription'],
  ]);
  expect(result.state.products[0]?.basePrice?.amount).toBe('4.99');
  expect(result.state.products[1]?.subscription?.period).toBe('P1M');
  expect(requests.map((request) => request.method)).toEqual(['GET', 'GET']);
});

test('Google Play immutable subscription period blocks planning', async () => {
  const result = await inspectGooglePlayMonetization({
    packageName: 'com.example.app',
    desired: DESIRED,
    request: inspectionTransport([], 'P1Y'),
    ...ACCESS,
  });
  expect(result.status).toBe('completed');
  if (result.status !== 'completed') return;
  const plan = createMonetizationPlan({
    desired: DESIRED,
    currentRevision: createMonetizationCurrentRevision([result.state]),
    states: [result.state],
  });
  expect(plan.status).toBe('blocked');
  expect(plan.diagnostics.map((item) => item.code)).toContain(
    'GOOGLE_PLAY_SUBSCRIPTION_PERIOD_IMMUTABLE',
  );
});

test('Google Play one-time creation uses modern monetization API', async () => {
  const requests: GooglePlayRequest[] = [];
  const [product] = DESIRED.products;
  if (product === undefined) throw new Error('Expected monetization product fixture.');
  const ok = await writeGooglePlayMonetizationProduct({
    packageName: 'com.example.app',
    product,
    operations: ['create-product'],
    token: 'token',
    request: createWriterTransport(requests),
  });
  expect(ok).toBe(true);
  expect(requests.map((request) => request.method)).toEqual(['POST', 'PATCH']);
  expect(requests[1]?.url).toContain('/onetimeproducts/premium.unlock?');
  const body = readBody(requests[1]);
  expect(body).toContain('"purchaseOptionId":"ankh-buy"');
  expect(body).toContain('"availability":"AVAILABLE"');
});

test('Google Play subscription creation keeps base plan in provider draft semantics', async () => {
  const requests: GooglePlayRequest[] = [];
  const [, product] = DESIRED.products;
  if (product === undefined) throw new Error('Expected subscription fixture.');
  const ok = await writeGooglePlayMonetizationProduct({
    packageName: 'com.example.app',
    product,
    operations: ['create-product'],
    token: 'token',
    request: createWriterTransport(requests),
  });
  expect(ok).toBe(true);
  expect(requests.map((request) => request.method)).toEqual(['POST', 'POST']);
  const body = readBody(requests[1]);
  expect(body).toContain('"basePlanId":"ankh-p1m"');
  expect(body).toContain('"billingPeriodDuration":"P1M"');
  expect(requests.some((request) => request.url.includes(':activate'))).toBe(false);
});

test('Google Play execution rejects provider drift before mutation', async () => {
  const inspection = await inspectGooglePlayMonetization({
    packageName: 'com.example.app',
    desired: DESIRED,
    request: inspectionTransport([]),
    ...ACCESS,
  });
  if (inspection.status !== 'completed') throw new Error('Expected completed inspection.');
  const plan = createMonetizationPlan({
    desired: DESIRED,
    currentRevision: 'planned',
    states: [inspection.state],
  });
  const requests: GooglePlayRequest[] = [];
  const result = await executeGooglePlayMonetizationPlan({
    packageName: 'com.example.app',
    desired: DESIRED,
    plan,
    expectedRevision: 'stale',
    request: inspectionTransport(requests),
    ...ACCESS,
  });
  expect(result.status).toBe('failed');
  if (result.status === 'failed') {
    expect(result.failure.code).toBe('GOOGLE_PLAY_MONETIZATION_DRIFT');
  }
  expect(requests.map((request) => request.method)).toEqual(['GET', 'GET']);
});

function inspectionTransport(requests: GooglePlayRequest[], period = 'P1M'): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    if (request.url.includes('/oneTimeProducts?')) {
      return Promise.resolve({ status: 200, body: JSON.stringify(oneTimeResponse()) });
    }
    if (request.url.includes('/subscriptions?')) {
      return Promise.resolve({ status: 200, body: JSON.stringify(subscriptionResponse(period)) });
    }
    return Promise.resolve({ status: 404, body: '{}' });
  };
}

function oneTimeResponse(): unknown {
  return {
    oneTimeProducts: [
      {
        productId: 'premium.unlock',
        listings: [{ languageCode: 'en-US', title: 'Premium', description: 'Unlock premium' }],
        purchaseOptions: [
          {
            purchaseOptionId: 'buy',
            buyOption: {},
            regionalPricingAndAvailabilityConfigs: [
              {
                regionCode: 'US',
                availability: 'AVAILABLE',
                price: { currencyCode: 'USD', units: '4', nanos: 990_000_000 },
              },
            ],
          },
        ],
      },
    ],
  };
}

function subscriptionResponse(period: string): unknown {
  return {
    subscriptions: [
      {
        productId: 'pro.monthly',
        listings: [{ languageCode: 'en-US', title: 'Pro', description: 'Monthly Pro' }],
        basePlans: [
          {
            basePlanId: 'monthly',
            autoRenewingBasePlanType: { billingPeriodDuration: period },
            regionalConfigs: [
              {
                regionCode: 'US',
                newSubscriberAvailability: true,
                price: { currencyCode: 'USD', units: '9', nanos: 990_000_000 },
              },
            ],
          },
        ],
      },
    ],
  };
}

function createWriterTransport(requests: GooglePlayRequest[]): GooglePlayTransport {
  return (request) => {
    requests.push(request);
    if (request.url.includes('/pricing:convertRegionPrices')) {
      return Promise.resolve({
        status: 200,
        body: JSON.stringify({ regionVersion: { version: '2026/08' } }),
      });
    }
    return Promise.resolve({ status: 200, body: '{}' });
  };
}

function readBody(request: GooglePlayRequest | undefined): string {
  if (request === undefined || typeof request.body !== 'string') {
    throw new Error('Expected serialized Google Play request body.');
  }
  return request.body;
}
