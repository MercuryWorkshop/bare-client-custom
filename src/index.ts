import { BareClient } from './BareClient';

export * from './Client';
export * from './BareTypes';
export * from './BareClient';
export { WebSocketFields } from "./snapshot";

/**
 *
 * Facilitates fetching the Bare server and constructing a BareClient.
 * @param server Bare server
 * @param signal Abort signal when fetching the manifest
 */
export async function createBareClient(
	...args: any[]
): Promise<BareClient> {
	return new BareClient();
}
