/*** Read stable authoring-registry values while requiring every record key to match owner identity. */
export function readDeployAuthoringRegistryValues<T>(
  registry: Readonly<Record<string, T>>,
  identityOf: (value: T) => string,
): readonly T[] {
  const entries = Object.entries(registry) as readonly (readonly [string, T])[];
  if (entries.some(([key, value]) => identityOf(value) !== key)) {
    throw new Error('DEPLOY_AUTHORING_VALUE_INVALID');
  }
  return entries.map(([, value]) => value);
}
