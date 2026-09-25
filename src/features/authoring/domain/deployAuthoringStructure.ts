import type { StructureDescriptorDocument } from '@ankhorage/contracts/structure';

import packageJson from '../../../../package.json';

const STRING = { kind: 'scalar', type: 'string' } as const;

/*** Publish the owner-owned structural semantics for Deploy desired-state authoring. */
export const DEPLOY_AUTHORING_STRUCTURE = {
  protocolVersion: 1,
  packageName: packageJson.name,
  packageVersion: packageJson.version,
  roots: {
    monetization: 'DeployMonetizationAuthoringValue',
    'prepared-release': 'DeployReleaseAuthoringValue',
    'store-listing-asset-location': 'ProjectStoreListingAssetLocation',
    'store-listing-locale': 'StoreListingLocale',
  },
  descriptors: {
    DeployMonetizationAuthoringValue: {
      id: 'DeployMonetizationAuthoringValue',
      descriptor: {
        kind: 'object',
        fields: {
          products: {
            value: {
              kind: 'entity-registry',
              key: STRING,
              value: { kind: 'ref', id: 'DeployMonetizationProductAuthoringValue' },
              identityField: 'id',
            },
          },
        },
      },
    },
    DeployMonetizationProductAuthoringValue: {
      id: 'DeployMonetizationProductAuthoringValue',
      descriptor: {
        kind: 'union',
        discriminator: 'kind',
        variants: [
          productVariant('consumable'),
          productVariant('non-consumable'),
          productVariant('subscription', true),
        ],
      },
    },
    MonetizationLocalization: {
      id: 'MonetizationLocalization',
      descriptor: {
        kind: 'object',
        fields: {
          description: { value: STRING },
          locale: { value: STRING },
          name: { value: STRING },
        },
      },
    },
    MonetizationBasePrice: {
      id: 'MonetizationBasePrice',
      descriptor: {
        kind: 'object',
        fields: {
          amount: { value: STRING },
          country: { value: STRING },
          currency: { value: STRING },
        },
      },
    },
    MonetizationSubscription: {
      id: 'MonetizationSubscription',
      descriptor: {
        kind: 'object',
        fields: {
          family: { value: STRING },
          level: { value: { kind: 'scalar', type: 'integer' }, optional: true },
          period: {
            value: {
              kind: 'enum',
              values: ['P1M', 'P1W', 'P1Y', 'P2M', 'P3M', 'P6M'],
            },
          },
        },
      },
    },
    DeployReleaseAuthoringValue: {
      id: 'DeployReleaseAuthoringValue',
      descriptor: {
        kind: 'object',
        fields: {
          notes: {
            value: {
              kind: 'entity-registry',
              key: STRING,
              value: { kind: 'ref', id: 'ReleaseNote' },
              identityField: 'locale',
            },
          },
          rollout: { value: { kind: 'ref', id: 'DeployReleaseAuthoringRollout' } },
          targets: {
            value: {
              kind: 'set',
              member: { kind: 'enum', values: ['android', 'ios', 'web'] },
            },
          },
          version: { value: STRING },
        },
      },
    },
    ReleaseNote: {
      id: 'ReleaseNote',
      descriptor: {
        kind: 'object',
        fields: {
          locale: { value: STRING },
          text: { value: STRING },
        },
      },
    },
    DeployReleaseAuthoringRollout: {
      id: 'DeployReleaseAuthoringRollout',
      descriptor: {
        kind: 'object',
        fields: {
          android: {
            optional: true,
            value: {
              kind: 'union',
              discriminator: 'mode',
              variants: [
                {
                  kind: 'object',
                  fields: {
                    mode: { value: { kind: 'enum', values: ['immediate'] } },
                  },
                },
                {
                  kind: 'object',
                  fields: {
                    initialFraction: { value: STRING },
                    mode: { value: { kind: 'enum', values: ['staged'] } },
                  },
                },
              ],
            },
          },
          ios: {
            optional: true,
            value: {
              kind: 'object',
              fields: {
                mode: { value: { kind: 'enum', values: ['immediate', 'staged'] } },
              },
            },
          },
          web: {
            optional: true,
            value: {
              kind: 'object',
              fields: {
                mode: { value: { kind: 'enum', values: ['immediate'] } },
              },
            },
          },
        },
      },
    },
    ProjectStoreListingAssetLocation: {
      id: 'ProjectStoreListingAssetLocation',
      descriptor: {
        kind: 'union',
        discriminator: 'kind',
        variants: [
          {
            kind: 'object',
            fields: {
              kind: { value: { kind: 'enum', values: ['android-shared'] } },
              variant: { value: { kind: 'enum', values: ['feature', 'icon'] } },
            },
          },
          {
            kind: 'object',
            fields: {
              filename: { value: STRING },
              kind: { value: { kind: 'enum', values: ['screenshot'] } },
              locale: { value: STRING },
              target: { value: { kind: 'enum', values: ['android', 'ios'] } },
              variant: { value: STRING },
            },
          },
        ],
      },
    },
    StoreListingLocale: {
      id: 'StoreListingLocale',
      descriptor: {
        kind: 'object',
        fields: {
          description: { value: STRING, optional: true },
          keywords: {
            value: { kind: 'ordered-list', item: STRING },
            optional: true,
          },
          locale: { value: STRING },
          marketingUrl: { value: STRING, optional: true },
          name: { value: STRING },
          privacyPolicyUrl: { value: STRING, optional: true },
          promoVideoUrl: { value: STRING, optional: true },
          promotionalText: { value: STRING, optional: true },
          summary: { value: STRING, optional: true },
          supportUrl: { value: STRING, optional: true },
        },
      },
    },
  },
} as const satisfies StructureDescriptorDocument;

/*** Build one product union variant while retaining stable product and localization identity semantics. */
function productVariant(kind: 'consumable' | 'non-consumable' | 'subscription', subscription = false) {
  return {
    kind: 'object' as const,
    fields: {
      basePrice: { value: { kind: 'ref' as const, id: 'MonetizationBasePrice' } },
      id: { value: STRING },
      kind: { value: { kind: 'enum' as const, values: [kind] } },
      localizations: {
        value: {
          kind: 'entity-registry' as const,
          key: STRING,
          value: { kind: 'ref' as const, id: 'MonetizationLocalization' },
          identityField: 'locale',
        },
      },
      ...(subscription
        ? {
            subscription: {
              value: { kind: 'ref' as const, id: 'MonetizationSubscription' },
            },
          }
        : {}),
    },
  };
}
