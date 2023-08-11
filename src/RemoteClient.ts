/// <reference lib="WebWorker" />
import type {
  BareCache,
  BareHeaders,
  BareMethod,
  BareResponse,
} from './BareTypes.js';
import { BareError, Client, statusEmpty } from './Client.js';
import type {
  ReadyStateCallback,
  MetaCallback,
  GetRequestHeadersCallback,
} from './Client.js';

import md5 from './md5.js';
import { WebSocketFields } from './snapshot.js';
import { joinHeaders, splitHeaders } from './splitHeaderUtil.js';
import { v4 as uuid } from 'uuid';

declare const self: ServiceWorkerGlobalScope;
export default class RemoteClient extends Client {
  private callbacks: Record<string, (message: Record<string, any>) => void> = {};

  private uid = uuid();
  constructor() {
    super();
    if (!("ServiceWorkerGlobalScope" in self)) {
      throw new TypeError("Attempt to construct RemoteClient from outside a service worker")
    }

    addEventListener("message", (event) => {
      if (event.data.__remote_target === this.uid) {
        const callback = this.callbacks[event.data.__remote_id];
        callback(event.data.__remote_value);
      }
    });

  }

  async send(message: Record<string, any>, id?: string) {
    const clients = await self.clients.matchAll();
    if (clients.length < 1)
      throw new Error("no available clients");

    for (const client of clients) {
      client.postMessage({
        __remote_target: this.uid,
        __remote_id: id,
        __remote_value: message
      })
    }

  }

  async sendWithResponse(message: Record<string, any>): Promise<any> {
    const id = uuid();
    return new Promise((resolve) => {
      this.callbacks[id] = resolve;
      this.send(message, id);
    });
  }

  connect(
    remote: URL,
    protocols: string[],
    getRequestHeaders: GetRequestHeadersCallback,
    onMeta: MetaCallback,
    onReadyState: ReadyStateCallback
  ) {
    const ws = new WebSocket("");

    const cleanup = () => {
      ws.removeEventListener('close', closeListener);
      ws.removeEventListener('message', messageListener);
    };

    const closeListener = () => {
      cleanup();
    };

    const messageListener = (event: MessageEvent) => {
      cleanup();

      // ws.binaryType is irrelevant when sending text
      if (typeof event.data !== 'string')
        throw new TypeError('the first websocket message was not a text frame');

      const message = JSON.parse(event.data) as SocketServerToClient;

      // finally
      if (message.type !== 'open')
        throw new TypeError('message was not of open type');

      event.stopImmediatePropagation();

      onMeta({
        protocol: message.protocol,
        setCookies: message.setCookies,
      });

      // now we want the client to see the websocket is open and ready to communicate with the remote
      onReadyState(WebSocketFields.OPEN);

      ws.dispatchEvent(new Event('open'));
    };

    ws.addEventListener('close', closeListener);
    ws.addEventListener('message', messageListener);

    // CONNECTED TO THE BARE SERVER, NOT THE REMOTE
    ws.addEventListener(
      'open',
      (event) => {
        // we have to cancel this event because it doesn't reflect the connection to the remote
        // once we are actually connected to the remote, we can dispatch a fake open event.
        event.stopImmediatePropagation();

        // we need to fake the readyState value again so it remains CONNECTING
        // right now, it's open because we just connected to the remote
        // but we need to fake this from the client so it thinks it's still connecting
        onReadyState(WebSocketFields.CONNECTING);

        getRequestHeaders().then((headers) =>
          WebSocketFields.prototype.send.call(
            ws,
            JSON.stringify({
              type: 'connect',
              remote: remote.toString(),
              protocols,
              headers,
              forwardHeaders: [],
            } as SocketClientToServer)
          )
        );
      },
      // only block the open event once
      { once: true }
    );

    return ws;
  }
  async request(
    method: BareMethod,
    requestHeaders: BareHeaders,
    body: BodyInit | null,
    remote: URL,
    cache: BareCache | undefined,
    duplex: string | undefined,
    signal: AbortSignal | undefined
  ): Promise<BareResponse> {

    const response = await this.sendWithResponse({
      type: "request",
      options: {
        method,
        requestHeaders,
        body,
        remote: remote.toString(),
      },
    });
    // const readResponse = await this.readBareResponse(response);

    const result: Response & Partial<BareResponse> = new Response(
      statusEmpty.includes(response.status!) ? undefined : response.body,
      {
        status: response.status,
        statusText: response.statusText ?? undefined,
        headers: new Headers(response.headers as HeadersInit),
      }
    );

    result.rawHeaders = response.headers;
    result.rawResponse = response;

    return result as BareResponse;
  }
}
