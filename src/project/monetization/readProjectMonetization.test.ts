import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { readProjectMonetization } from './readProjectMonetization';

test('reads canonical monetization products deterministically', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-monetization-'));
  try {
    await fs.mkdir(path.join(root, 'deploy/monetization'), { recursive: true });
    await fs.writeFile(
      path.join(root, 'deploy/monetization/products.json'),
      JSON.stringify(fixture()),
    );
    const result = await readProjectMonetization({ projectRoot: root });
    expect(result.products[0]?.basePrice).toEqual({
      country: 'CH',
      currency: 'CHF',
      amount: '4.9',
    });
    expect(result.products[0]?.localizations.map((item) => item.locale)).toEqual([
      'de-CH',
      'en-US',
    ]);
    expect(result.revision).toHaveLength(64);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('missing monetization file is an empty authored state', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-monetization-'));
  try {
    const result = await readProjectMonetization({ projectRoot: root });
    expect(result.products).toEqual([]);
    expect(result.revision).toHaveLength(64);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('rejects duplicate product ids and unknown authored fields', async () => {
  const root = await fs.mkdtemp(path.join(tmpdir(), 'ankh-monetization-'));
  try {
    await fs.mkdir(path.join(root, 'deploy/monetization'), { recursive: true });
    const [product] = fixture().products;
    if (product === undefined) throw new Error('Expected monetization product fixture.');
    await fs.writeFile(
      path.join(root, 'deploy/monetization/products.json'),
      JSON.stringify({ products: [product, product], secret: 'nope' }),
    );
    expect(readProjectMonetization({ projectRoot: root })).rejects.toThrow(
      'MONETIZATION_PRODUCTS_INVALID',
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

function fixture() {
  return {
    products: [
      {
        id: 'premium.unlock',
        kind: 'non-consumable',
        localizations: [
          { locale: 'en-us', name: 'Premium', description: 'Unlock premium' },
          { locale: 'de-ch', name: 'Premium', description: 'Premium freischalten' },
        ],
        basePrice: { country: 'ch', currency: 'chf', amount: '4.900' },
      },
    ],
  };
}
