import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: ['src/index.ts', 'src/project/index.ts', 'src/cli/index.ts'],
  ignoreFiles: [
    '.prettierrc.js',
    'eslint.config.mjs',
    'eslint.local.config.mjs',
    'paradox.config.ts',
    'prettier.local.config.js',
  ],
});
