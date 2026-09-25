import type { EntityRegistry, SerializableSet } from '@ankhorage/contracts/structure';

import type { MonetizationBasePrice } from '../domain/monetization/MonetizationBasePrice';
import type { MonetizationLocalization } from '../domain/monetization/MonetizationLocalization';
import type { MonetizationSubscription } from '../domain/monetization/MonetizationSubscription';
import type { ReleaseNote } from '../domain/release/ReleaseNote';
import type { ReleaseTarget } from '../domain/release/ReleaseTarget';

export interface DeployMonetizationAuthoringValue {
  readonly products: EntityRegistry<string, DeployMonetizationProductAuthoringValue, 'id'>;
}

interface DeployMonetizationProductAuthoringBase {
  readonly id: string;
  readonly localizations: EntityRegistry<string, MonetizationLocalization, 'locale'>;
  readonly basePrice: MonetizationBasePrice;
}

export type DeployMonetizationProductAuthoringValue =
  | (DeployMonetizationProductAuthoringBase & {
      readonly kind: 'consumable';
      readonly subscription?: never;
    })
  | (DeployMonetizationProductAuthoringBase & {
      readonly kind: 'non-consumable';
      readonly subscription?: never;
    })
  | (DeployMonetizationProductAuthoringBase & {
      readonly kind: 'subscription';
      readonly subscription: MonetizationSubscription;
    });

export interface DeployReleaseAuthoringValue {
  readonly version: string;
  readonly targets: SerializableSet<ReleaseTarget>;
  readonly notes: EntityRegistry<string, ReleaseNote, 'locale'>;
  readonly rollout: DeployReleaseAuthoringRollout;
}

export interface DeployReleaseAuthoringRollout {
  readonly web?: {
    readonly mode: 'immediate';
  };
  readonly android?:
    | {
        readonly mode: 'immediate';
      }
    | {
        readonly mode: 'staged';
        readonly initialFraction: string;
      };
  readonly ios?: {
    readonly mode: 'immediate' | 'staged';
  };
}
