import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { expect, test } from 'bun:test';

import { expectRejects } from '../expectRejects.test';
import { readProjectMonetization } from './readProjectMonetization';
import { writeProjectMonetization } from './writeProjectMonetization';

test('monetization authoring validates, normalizes, persists, and revises', async () => {
  const root = await createRoot();
  try {
    const written = await writeProjectMonetization({
      projectRoot: root,
      products: [
        {
          id: 'pro.monthly',
          kind: 'subscription',
          localizations: [{ locale: 'en-us', name: 'Pro', description: 'Monthly Pro' }],
          basePrice: { country: 'ch', currency: 'chf', amount: '4.9900' },
          subscription: { family: 'pro', period: 'P1M', level: 1 },
        },
      ],
    });

    expect(written.products[0]).toMatchObject({
      id: 'pro.monthly',
      localizations: [{ locale: 'en-US', name: 'Pro', description: 'Monthly Pro' }],
      basePrice: { country: 'CH', currency: 'CHF', amount: '4.99' },
    });
    expect(written.revision.length).toBeGreaterThan(0);
    expect(await readProjectMonetization({ projectRoot: root })).toEqual(written);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('invalid monetization authoring is rejected before replacing canonical state', async () => {
  const root = await createRoot();
  try {
    const initial = await writeProjectMonetization({
      projectRoot: root,
      products: [
        {
          id: 'coins',
          kind: 'consumable',
          localizations: [{ locale: 'en-US', name: 'Coins', description: 'Coin pack' }],
          basePrice: { country: 'CH', currency: 'CHF', amount: '1.5' },
        },
      ],
    });
    await expectRejects(
      writeProjectMonetization({
        projectRoot: root,
        products: [
          {
            id: 'broken',
            kind: 'consumable',
            localizations: [{ locale: 'en-US', name: 'Broken', description: 'Broken' }],
            basePrice: { country: 'CH', currency: 'CHF', amount: '0' },
          },
        ],
      }),
      'MONETIZATION_PRODUCTS_INVALID',
    );

    expect(await readProjectMonetization({ projectRoot: root })).toEqual(initial);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

async function createRoot(): Promise<string> {
  return fs.mkdtemp(path.join(tmpdir(), 'ankh-deploy-monetization-authoring-'));
}
