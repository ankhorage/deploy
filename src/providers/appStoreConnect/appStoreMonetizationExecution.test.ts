import { expect, test } from 'bun:test';

import { createMonetizationCurrentRevision } from '../../domain/monetization/createMonetizationCurrentRevision';
import { createMonetizationPlan } from '../../domain/monetization/createMonetizationPlan';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { AppStoreConnectRequest, AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreMonetizationSnapshot } from './AppStoreMonetizationSnapshot';
import { executeAppStoreMonetizationPlan } from './executeAppStoreMonetizationPlan';
import { writeAppStoreMonetizationProduct } from './writeAppStoreMonetizationProduct';

const ACCESS = {
  credentials: [{ provider: 'app-store-connect', id: 'key', kind: 'api-key' }] as const,
  resolveSecret: () =>
    Promise.resolve(
      JSON.stringify({ keyId: 'KEY', issuerId: 'ISSUER', privateKey: 'PRIVATE_KEY_SENTINEL' }),
    ),
  createToken: () => Promise.resolve('token'),
  now: new Date('2026-08-13T12:00:00Z'),
} as const;

const EMPTY_SNAPSHOT: AppStoreMonetizationSnapshot = {
  appId: 'app-1',
  products: [],
  families: [],
  diagnostics: [],
};

test('App Store IAP creation uses versioned v2 metadata and pricing', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const [product] = iapDesired().products;
  if (product === undefined) throw new Error('Expected IAP fixture.');
  const result = await writeAppStoreMonetizationProduct({
    snapshot: EMPTY_SNAPSHOT,
    product,
    operations: ['create-product'],
    request: createIapTransport(requests),
    token: 'token',
    now: ACCESS.now,
  });
  expect(result).toBe(true);
  expect(requests.some((item) => item.url.endsWith('/v2/inAppPurchases'))).toBe(true);
  expect(requests.some((item) => item.url.endsWith('/v1/inAppPurchaseVersions'))).toBe(true);
  expect(requests.some((item) => item.url.endsWith('/v2/inAppPurchaseLocalizations'))).toBe(true);
  expect(requests.some((item) => item.url.endsWith('/v1/inAppPurchasePriceSchedules'))).toBe(true);
  expect(requests.some((item) => item.url.includes('reviewSubmission'))).toBe(false);
  expect(serializedBody(requests, '/v2/inAppPurchaseLocalizations')).toContain(
    '"type":"inAppPurchaseVersions"',
  );
});

test('App Store subscription creation ensures group and preserves existing prices', async () => {
  const requests: AppStoreConnectRequest[] = [];
  const [product] = subscriptionDesired().products;
  if (product === undefined) throw new Error('Expected subscription fixture.');
  const result = await writeAppStoreMonetizationProduct({
    snapshot: EMPTY_SNAPSHOT,
    product,
    operations: ['ensure-subscription-family', 'create-product'],
    request: createSubscriptionTransport(requests),
    token: 'token',
    now: ACCESS.now,
  });
  expect(result).toBe(true);
  expect(requests[0]?.method).toBe('GET');
  expect(requests[0]?.url).toContain('/v1/apps/app-1/subscriptionGroups?');
  expect(requests[1]?.method).toBe('POST');
  expect(requests[1]?.url).toContain('/v1/subscriptionGroups');
  expect(requests[2]?.method).toBe('POST');
  expect(requests[2]?.url).toContain('/v1/subscriptions');
  expect(serializedBody(requests, '/v1/subscriptionPrices')).toContain(
    '"preserveCurrentPrice":true',
  );
  expect(requests.some((item) => item.url.includes('reviewSubmission'))).toBe(false);
});

test('App Store execution rejects drift before any mutation', async () => {
  const desired: MonetizationDesiredState = { revision: 'desired', products: [] };
  const state = {
    target: 'ios',
    products: [],
    subscriptionFamilies: [],
    diagnostics: [],
  } as const;
  const plan = createMonetizationPlan({
    desired,
    currentRevision: createMonetizationCurrentRevision([state]),
    states: [state],
  });
  const requests: AppStoreConnectRequest[] = [];
  const result = await executeAppStoreMonetizationPlan({
    bundleIdentifier: 'com.example.app',
    desired,
    plan,
    expectedRevision: 'stale',
    request: driftTransport(requests),
    ...ACCESS,
  });
  expect(result.status).toBe('failed');
  if (result.status === 'failed') expect(result.failure.code).toBe('APP_STORE_MONETIZATION_DRIFT');
  expect(requests.every((item) => item.method === 'GET')).toBe(true);
});

function iapDesired(): MonetizationDesiredState {
  return {
    revision: 'iap',
    products: [
      {
        id: 'premium.unlock',
        kind: 'non-consumable',
        localizations: [{ locale: 'en-US', name: 'Premium', description: 'Unlock premium' }],
        basePrice: { country: 'US', currency: 'USD', amount: '4.99' },
      },
    ],
  };
}

function subscriptionDesired(): MonetizationDesiredState {
  return {
    revision: 'sub',
    products: [
      {
        id: 'pro.monthly',
        kind: 'subscription',
        localizations: [{ locale: 'en-US', name: 'Pro', description: 'Monthly Pro' }],
        basePrice: { country: 'US', currency: 'USD', amount: '9.99' },
        subscription: { family: 'pro', period: 'P1M', level: 1 },
      },
    ],
  };
}

function createIapTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(iapTransportResponse(request));
  };
}

function iapTransportResponse(request: AppStoreConnectRequest): { status: number; body: string } {
  if (request.method === 'POST' && request.url.endsWith('/v2/inAppPurchases')) {
    return response(201, resource('inAppPurchases', 'iap-new'));
  }
  if (request.method === 'GET' && request.url.includes('/inAppPurchases/iap-new/versions')) {
    return response(200, { data: [] });
  }
  if (request.method === 'POST' && request.url.endsWith('/v1/inAppPurchaseVersions')) {
    return response(201, resource('inAppPurchaseVersions', 'iap-version'));
  }
  if (
    request.method === 'GET' &&
    request.url.includes('/inAppPurchaseVersions/iap-version/localizations')
  ) {
    return response(200, { data: [] });
  }
  if (request.method === 'POST' && request.url.endsWith('/v2/inAppPurchaseLocalizations')) {
    return response(201, resource('inAppPurchaseLocalizations', 'loc'));
  }
  if (request.method === 'GET' && request.url.includes('/inAppPurchases/iap-new/pricePoints')) {
    return response(200, pricePoints('iap-point', '4.99'));
  }
  if (request.method === 'POST' && request.url.endsWith('/v1/inAppPurchasePriceSchedules')) {
    return response(201, resource('inAppPurchasePriceSchedules', 'schedule'));
  }
  return response(404, {});
}

function createSubscriptionTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(subscriptionTransportResponse(request));
  };
}

function subscriptionTransportResponse(request: AppStoreConnectRequest): {
  status: number;
  body: string;
} {
  if (request.method === 'GET') return subscriptionGetResponse(request.url);
  if (request.method === 'POST') return subscriptionPostResponse(request.url);
  return response(404, {});
}

function subscriptionGetResponse(url: string): { status: number; body: string } {
  if (url.includes('/subscriptionGroups?')) return response(200, { data: [] });
  if (url.includes('/subscriptions/sub-new/versions')) return response(200, { data: [] });
  if (url.includes('/subscriptionVersions/sub-version/localizations')) {
    return response(200, { data: [] });
  }
  if (url.includes('/subscriptions/sub-new/pricePoints')) {
    return response(200, pricePoints('sub-point', '9.99'));
  }
  return response(404, {});
}

function subscriptionPostResponse(url: string): { status: number; body: string } {
  if (url.endsWith('/v1/subscriptionGroups')) {
    return response(201, resource('subscriptionGroups', 'group-new'));
  }
  if (url.endsWith('/v1/subscriptions')) {
    return response(201, resource('subscriptions', 'sub-new'));
  }
  if (url.endsWith('/v1/subscriptionVersions')) {
    return response(201, resource('subscriptionVersions', 'sub-version'));
  }
  if (url.endsWith('/v2/subscriptionLocalizations')) {
    return response(201, resource('subscriptionLocalizations', 'loc'));
  }
  if (url.endsWith('/v1/subscriptionPrices')) {
    return response(201, resource('subscriptionPrices', 'price'));
  }
  return response(404, {});
}

function driftTransport(requests: AppStoreConnectRequest[]): AppStoreConnectTransport {
  return (request) => {
    requests.push(request);
    return Promise.resolve(driftTransportResponse(request));
  };
}

function driftTransportResponse(request: AppStoreConnectRequest): { status: number; body: string } {
  if (request.url.includes('/apps?')) {
    return response(200, {
      data: [{ type: 'apps', id: 'app-1', attributes: { bundleId: 'com.example.app' } }],
    });
  }
  if (request.url.includes('/inAppPurchasesV2?')) return response(200, { data: [] });
  if (request.url.includes('/subscriptionGroups?')) return response(200, { data: [] });
  return response(404, {});
}

function pricePoints(id: string, amount: string): unknown {
  return {
    data: [{ type: 'pricePoint', id, attributes: { customerPrice: amount } }],
    included: [{ type: 'territories', id: 'USA', attributes: { currency: 'USD' } }],
  };
}

function resource(type: string, id: string): unknown {
  return { data: { type, id } };
}

function response(status: number, body: unknown): { status: number; body: string } {
  return { status, body: JSON.stringify(body) };
}

function serializedBody(requests: readonly AppStoreConnectRequest[], urlSuffix: string): string {
  const match = requests.find((item) => item.url.endsWith(urlSuffix));
  if (match?.body === undefined) {
    throw new Error(`Expected request body for ${urlSuffix}.`);
  }
  return match.body;
}
