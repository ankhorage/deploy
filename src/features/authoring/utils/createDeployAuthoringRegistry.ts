/*** Build one immutable authoring registry and reject duplicate owner identities. */
export function createDeployAuthoringRegistry<T>(
  entries: readonly (readonly [string, T])[],
): Readonly<Record<string, T>> {
  const keys = entries.map(([key]) => key);
  if (new Set(keys).size !== keys.length) throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
  return Object.fromEntries(entries);
}
