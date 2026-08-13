import type { MonetizationPlanStep } from '../../domain/monetization/MonetizationPlanStep';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import { convertGooglePlayRegionPrices } from './convertGooglePlayRegionPrices';
import { googlePlayMonetizationUrls } from './googlePlayMonetizationUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { toGooglePlayMoney } from './toGooglePlayMoney';
import { updateGooglePlayMonetizationPrice } from './updateGooglePlayMonetizationPrice';

interface GooglePlayMonetizationWriteOptions {
  readonly packageName: string;
  readonly product: MonetizationProduct;
  readonly operations: readonly MonetizationPlanStep['operation'][];
  readonly token: string;
  readonly request: GooglePlayTransport;
}

export async function writeGooglePlayMonetizationProduct(
  options: GooglePlayMonetizationWriteOptions,
): Promise<boolean> {
  if (options.operations.includes('update-subscription')) return false;
  const conversion = await convertGooglePlayRegionPrices({
    packageName: options.packageName,
    basePrice: options.product.basePrice,
    token: options.token,
    request: options.request,
  });
  if (conversion === null) return false;
  if (options.operations.includes('create-product')) {
    return createProduct(options, conversion.regionVersion);
  }
  if (
    options.operations.includes('update-metadata') &&
    !(await updateMetadata(options, conversion.regionVersion))
  ) {
    return false;
  }
  if (options.operations.includes('update-price')) {
    return updateGooglePlayMonetizationPrice({
      ...options,
      regionVersion: conversion.regionVersion,
    });
  }
  return true;
}

function createProduct(
  options: GooglePlayMonetizationWriteOptions,
  regionVersion: string,
): Promise<boolean> {
  return options.product.kind === 'subscription'
    ? createSubscription(options, regionVersion)
    : createOneTimeProduct(options, regionVersion);
}

async function createOneTimeProduct(
  options: GooglePlayMonetizationWriteOptions,
  regionVersion: string,
): Promise<boolean> {
  const { product } = options;
  const response = await options.request({
    method: 'PATCH',
    url: googlePlayMonetizationUrls.oneTimePatch(
      options.packageName,
      product.id,
      regionVersion,
      'listings,purchaseOptions',
      true,
    ),
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify({
      packageName: options.packageName,
      productId: product.id,
      listings: listings(product),
      purchaseOptions: [newBuyOption(product)],
    }),
  });
  return ok(response.status);
}

async function createSubscription(
  options: GooglePlayMonetizationWriteOptions,
  regionVersion: string,
): Promise<boolean> {
  const { product } = options;
  if (product.subscription === undefined) return false;
  const response = await options.request({
    method: 'POST',
    url: googlePlayMonetizationUrls.subscriptionCreate(
      options.packageName,
      product.id,
      regionVersion,
    ),
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify({
      packageName: options.packageName,
      productId: product.id,
      listings: listings(product),
      basePlans: [newBasePlan(product)],
    }),
  });
  return ok(response.status);
}

async function updateMetadata(
  options: GooglePlayMonetizationWriteOptions,
  regionVersion: string,
): Promise<boolean> {
  const { product } = options;
  const url =
    product.kind === 'subscription'
      ? googlePlayMonetizationUrls.subscriptionPatch(
          options.packageName,
          product.id,
          regionVersion,
          'listings',
        )
      : googlePlayMonetizationUrls.oneTimePatch(
          options.packageName,
          product.id,
          regionVersion,
          'listings',
        );
  const response = await options.request({
    method: 'PATCH',
    url,
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify({
      packageName: options.packageName,
      productId: product.id,
      listings: listings(product),
    }),
  });
  return ok(response.status);
}

function listings(product: MonetizationProduct): readonly Record<string, string>[] {
  return product.localizations.map((item) => ({
    languageCode: item.locale,
    title: item.name,
    description: item.description,
  }));
}

function newBuyOption(product: MonetizationProduct): Record<string, unknown> {
  return {
    purchaseOptionId: 'ankh-buy',
    regionalPricingAndAvailabilityConfigs: [
      {
        regionCode: product.basePrice.country,
        price: toGooglePlayMoney(product.basePrice),
        availability: 'AVAILABLE',
      },
    ],
    buyOption: {},
  };
}

function newBasePlan(product: MonetizationProduct): Record<string, unknown> {
  const { subscription } = product;
  if (subscription === undefined) return {};
  return {
    basePlanId: `ankh-${subscription.period.toLowerCase()}`,
    regionalConfigs: [
      {
        regionCode: product.basePrice.country,
        newSubscriberAvailability: true,
        price: toGooglePlayMoney(product.basePrice),
      },
    ],
    autoRenewingBasePlanType: { billingPeriodDuration: subscription.period },
  };
}

function ok(status: number): boolean {
  return status >= 200 && status < 300;
}
