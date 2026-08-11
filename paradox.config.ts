import { defineParadoxConfig } from '@ankhorage/paradox';

export default defineParadoxConfig({
  mode: 'write',
  docs: {
    title: '@ankhorage/deploy',
    description: 'Declarative deployment engine for Expo apps across web, iOS, and Android.',
  },
  package: {
    root: '.',
    entrypoints: ['src/index.ts'],
  },
  output: {
    dir: './paradox',
  },
});
