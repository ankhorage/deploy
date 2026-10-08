import type { Capability } from '@ankhorage/contracts/capabilities';

/*** Publish Deploy's canonical executable capability for Ankh discovery and bindings. */
export const CAPABILITIES = [
  {
    id: 'deploy.execute',
    owner: '@ankhorage/deploy',
    access: ['invoke'],
    binding: { kind: 'action', bindableAs: ['target'] },
    label: 'Execute deployment',
    description: 'Inspect, plan and execute the authored project release.',
  },
] as const satisfies readonly Capability[];
