import { expect } from 'bun:test';

export async function expectRejects(
  promise: Promise<unknown>,
  messageFragment: string,
): Promise<void> {
  let caught: unknown;

  try {
    await promise;
  } catch (error) {
    caught = error;
  }

  expect(caught).toBeInstanceOf(Error);
  if (!(caught instanceof Error)) {
    throw new Error('Expected promise to reject with an Error.');
  }
  expect(caught.message).toContain(messageFragment);
}
