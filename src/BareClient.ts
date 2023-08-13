import type {
	BareHeaders,
	BareManifest,
	BareResponse,
	BareResponseFetch,
} from './BareTypes';
import { maxRedirects } from './BareTypes';
import type { Client, WebSocketImpl } from './Client';
import { statusRedirect } from './Client';
import { WebSocketFields } from './snapshot';
import { validProtocol } from './webSocket';
import RemoteClient from './RemoteClient';

// get the unhooked value
const getRealReadyState = Object.getOwnPropertyDescriptor(
	WebSocket.prototype,
	'readyState'
)!.get!;

const wsProtocols = ['ws:', 'wss:'];

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BareWebSocket {
	export type GetReadyStateCallback = () => number;
	export type GetSendErrorCallback = () => Error | undefined;
	export type GetProtocolCallback = () => string;
	export type HeadersType = BareHeaders | Headers | undefined;
	export type HeadersProvider =
		| BareHeaders
		| (() => BareHeaders | Promise<BareHeaders>);

	export interface Options {
		/**
		 * A provider of request headers to pass to the remote.
		 * Usually one of `User-Agent`, `Origin`, and `Cookie`
		 * Can be just the headers object or an synchronous/asynchronous function that returns the headers object
		 */
		headers?: BareWebSocket.HeadersProvider;
		/**
		 * A hook executed by this function with helper arguments for hooking the readyState property. If a hook isn't provided, bare-client will hook the property on the instance. Hooking it on an instance basis is good for small projects, but ideally the class should be hooked by the user of bare-client.
		 */
		readyStateHook?:
		| ((
			socket: WebSocket,
			getReadyState: BareWebSocket.GetReadyStateCallback
		) => void)
		| undefined;
		/**
		 * A hook executed by this function with helper arguments for determining if the send function should throw an error. If a hook isn't provided, bare-client will hook the function on the instance.
		 */
		sendErrorHook?:
		| ((
			socket: WebSocket,
			getSendError: BareWebSocket.GetSendErrorCallback
		) => void)
		| undefined;
		/**
		 * A hook executed by this function with the URL. If a hook isn't provided, bare-client will hook the URL.
		 */
		urlHook?: ((socket: WebSocket, url: URL) => void) | undefined;
		/**
		 * A hook executed by this function with a helper for getting the current fake protocol. If a hook isn't provided, bare-client will hook the protocol.
		 */
		protocolHook?:
		| ((
			socket: WebSocket,
			getProtocol: BareWebSocket.GetProtocolCallback
		) => void)
		| undefined;
		/**
		 * A callback executed by this function with an array of cookies. This is called once the metadata from the server is received.
		 */
		setCookiesCallback?: ((setCookies: string[]) => void) | undefined;
		webSocketImpl?: WebSocketImpl;
	}
}


// global variable. nasty, but neccesary
declare global {
	interface ServiceWorkerGlobalScope {
		gBareClientImplementation: Client | undefined;
	}
	interface WorkerGlobalScope {
		gBareClientImplementation: Client | undefined;
	}
	interface Window {
		gBareClientImplementation: Client | undefined;
	}
}
export function setBareClientImplementation(implementation: Client) {
	self.gBareClientImplementation = implementation;
	console.log("WHUISDFJKASDHJKAS");

	if ("window" in self) {
		console.log("IMPLIII");
		window.gBareClientImplementation = implementation;
	}
}

if ("ServiceWorkerGlobalScope" in self) {
	setBareClientImplementation(new RemoteClient());
} else {
	// @ts-ignore
	let parent = self;

	console.log("attempting to find an implementation");
	//@ts-ignore
	for (let i = 0; i < 99; i++) {
		console.log("goign through one iteration :: " + i);
		//@ts-ignore
		parent = parent.parent;
		//@ts-ignore
		if (parent && parent["gBareClientImplementation"]) {
			console.warn("found implementation on parent");
			//@ts-ignore
			setBareClientImplementation(parent["gBareClientImplementation"]);
			break;
		}

	}
}

export function registerRemoteListener() {

	(navigator as any).serviceWorker.addEventListener("message", async (event: any) => {

		console.log(event);

		const uid = event.data.__remote_target;
		console.log(uid);
		if (uid) {
			const rid = event.data.__remote_id;



			switch (event.data.__remote_value.type) {
				case "request": {

					const data = event.data.__remote_value.options;

					console.log("handling request");

					const rawResponse = await self.gBareClientImplementation!.request(data.method, data.requestHeaders, data.body, new URL(data.remote), undefined, undefined, undefined);

					const body = await rawResponse.blob();

					console.log("sent request");
					console.log(rawResponse.headers);
					(navigator as any).serviceWorker.controller?.postMessage({
						__remote_target: uid,
						__remote_id: rid,
						__remote_value: {
							status: rawResponse.status,
							statusText: rawResponse.statusText,
							headers: Object.fromEntries(rawResponse.headers.entries()),
							redirected: rawResponse.redirected,
							body
						}
					});
					break;
				}
			}

		}
	});
}

// class MockSocket implements WebSocket {
// 	binaryType: BinaryType = "arraybuffer";
// 	bufferedAmount = 0;
// 	extensions = "";
// 	onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
// 	onerror: ((this: WebSocket, ev: Event) => any) | null = null;
// 	onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;
// 	onopen: ((this: WebSocket, ev: Event) => any) | null = null;
// 	protocol = "";
// 	readyState = 0;
// 	url = "";
// 	close(code?: number | undefined, reason?: string | undefined): void;
// 	close(code?: number | undefined, reason?: string | undefined): void;
// 	close(code?: unknown, reason?: unknown): void {

// 	}
// 	send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
// 	send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
// 	send(data: unknown): void {

// 	}
// 	CONNECTING: 0 = 0 as const;
// 	OPEN: 1 = 1 as const;
// 	CLOSING: 2 = 2 as const;
// 	CLOSED: 3 = 3 as const;

// 	addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
// 	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
// 	addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions | undefined): void;
// 	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions | undefined): void;
// 	addEventListener(type: unknown, listener: unknown, options?: unknown): void {

// 	}
// 	removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
// 	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
// 	removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions | undefined): void;
// 	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions | undefined): void;
// 	removeEventListener(type: unknown, listener: unknown, options?: unknown): void {

// 	}
// 	dispatchEvent(event: Event): boolean;
// 	dispatchEvent(event: Event): boolean;
// 	dispatchEvent(event: unknown): boolean {
// 		return true;
// 	}

// 	constructor(private client: Client) {

// 	}

// }
export class BareClient {
	constructor(...unused: any[]) {
		(_ => _)();
	}

	createWebSocket(
		remote: string | URL,
		protocols: string | string[] | undefined = [],
		options: BareWebSocket.Options
	): WebSocket {
		if (!self.gBareClientImplementation)
			throw new TypeError(
				"A request was made before the client was ready!! This is a problem on the end of whoever set the bare client implementation"
			);

		try {
			remote = new URL(remote);
		} catch (err) {
			throw new DOMException(
				`Faiiled to construct 'WebSocket': The URL '${remote}' is invalid.`
			);
		}

		if (!wsProtocols.includes(remote.protocol))
			throw new DOMException(
				`Failed to construct 'WebSocket': The URL's scheme must be either 'ws' or 'wss'. '${remote.protocol}' is not allowed.`
			);

		if (!Array.isArray(protocols)) protocols = [protocols];

		protocols = protocols.map(String);

		for (const proto of protocols)
			if (!validProtocol(proto))
				throw new DOMException(
					`Failed to construct 'WebSocket': The subprotocol '${proto}' is invalid.`
				);

		const socket =
			self.gBareClientImplementation.connect(
				remote,
				protocols,
				async () => {
					const resolvedHeaders =
						typeof options.headers === 'function'
							? await options.headers()
							: options.headers || {};

					const requestHeaders: BareHeaders =
						resolvedHeaders instanceof Headers
							? Object.fromEntries(resolvedHeaders)
							: resolvedHeaders;

					// user is expected to specify user-agent and origin
					// both are in spec

					requestHeaders['Host'] = (remote as URL).host;
					// requestHeaders['Origin'] = origin;
					requestHeaders['Pragma'] = 'no-cache';
					requestHeaders['Cache-Control'] = 'no-cache';
					requestHeaders['Upgrade'] = 'websocket';
					// requestHeaders['User-Agent'] = navigator.userAgent;
					requestHeaders['Connection'] = 'Upgrade';

					return requestHeaders;
				},
				(meta) => {
					fakeProtocol = meta.protocol;
					if (options.setCookiesCallback)
						options.setCookiesCallback(meta.setCookies);
				},
				(readyState) => {
					fakeReadyState = readyState;
				},
				options.webSocketImpl || WebSocket
			);

		// protocol is always an empty before connecting
		// updated when we receive the metadata
		// this value doesn't change when it's CLOSING or CLOSED etc
		let fakeProtocol = '';

		let fakeReadyState: number = WebSocketFields.CONNECTING;

		const getReadyState = () => {
			const realReadyState = getRealReadyState.call(socket);
			// readyState should only be faked when the real readyState is OPEN
			return realReadyState === WebSocketFields.OPEN
				? fakeReadyState
				: realReadyState;
		};

		if (options.readyStateHook) options.readyStateHook(socket, getReadyState);
		else {
			// we have to hook .readyState ourselves

			Object.defineProperty(socket, 'readyState', {
				get: getReadyState,
				configurable: true,
				enumerable: true,
			});
		}

		/**
		 * @returns The error that should be thrown if send() were to be called on this socket according to the fake readyState value
		 */
		const getSendError = () => {
			const readyState = getReadyState();

			if (readyState === WebSocketFields.CONNECTING)
				return new DOMException(
					"Failed to execute 'send' on 'WebSocket': Still in CONNECTING state."
				);
		};

		if (options.sendErrorHook) options.sendErrorHook(socket, getSendError);
		else {
			// we have to hook .send ourselves
			// use ...args to avoid giving the number of args a quantity
			// no arguments will trip the following error: TypeError: Failed to execute 'send' on 'WebSocket': 1 argument required, but only 0 present.
			socket.send = function (...args) {
				const error = getSendError();

				if (error) throw error;
				else WebSocketFields.prototype.send.call(this, ...args);
			};
		}

		if (options.urlHook) options.urlHook(socket, remote);
		else
			Object.defineProperty(socket, 'url', {
				get: () => remote.toString(),
				configurable: true,
				enumerable: true,
			});

		const getProtocol = () => fakeProtocol;

		if (options.protocolHook) options.protocolHook(socket, getProtocol);
		else
			Object.defineProperty(socket, 'protocol', {
				get: getProtocol,
				configurable: true,
				enumerable: true,
			});



		return socket;
	}

	async fetch(
		url: string | URL,
		init?: RequestInit
	): Promise<BareResponseFetch> {
		// Only create an instance of Request to parse certain parameters of init such as method, headers, redirect
		// But use init values whenever possible
		const req = new Request(url, init);

		// try to use init.headers because it may contain capitalized headers
		// furthermore, important headers on the Request class are blocked...
		// we should try to preserve the capitalization due to quirks with earlier servers
		const inputHeaders = init?.headers || req.headers;

		const headers: BareHeaders =
			inputHeaders instanceof Headers
				? Object.fromEntries(inputHeaders)
				: (inputHeaders as BareHeaders);

		// @ts-ignore
		const duplex: string | undefined = init?.duplex;

		const body = init?.body || req.body;

		let urlO = new URL(req.url);

		if (!self.gBareClientImplementation)
			throw new TypeError(
				"A request was made before the client was ready!! This is a problem on the end of whoever set the bare client implementation"
			);

		for (let i = 0; ; i++) {
			if ('host' in headers) headers.host = urlO.host;
			else headers.Host = urlO.host;

			const response: BareResponse & Partial<BareResponseFetch> =
				await self.gBareClientImplementation.request(
					req.method,
					headers,
					body,
					urlO,
					req.cache,
					duplex,
					req.signal
				);

			response.finalURL = urlO.toString();

			const redirect = init?.redirect || req.redirect;

			if (statusRedirect.includes(response.status)) {
				switch (redirect) {
					case 'follow': {
						const location = response.headers.get('location');
						if (maxRedirects > i && location !== null) {
							urlO = new URL(location, urlO);
							continue;
						} else throw new TypeError('Failed to fetch');
					}
					case 'error':
						throw new TypeError('Failed to fetch');
					case 'manual':
						return response as BareResponseFetch;
				}
			} else {
				return response as BareResponseFetch;
			}
		}
	}
}
