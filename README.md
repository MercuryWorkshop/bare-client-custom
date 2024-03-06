# Bare-Client-Custom

**this is deprecated and will no longer be recieving updates, please use [bare-mux](https://github.com/MercuryWorkshop/bare-mux) instead**


a mock bare client allowing you to slip in custom values for testing.


replace in package.json:
`"@tomphttp/bare-client": "version"`
with 
`"@tomphttp/bare-client": "file:../bare-client-custom/"`
and rebuild to take advantage of bare-client-custom




on the client side, create a class that extends `Client` 


```
class TestClient extends Client {
   
   request(method: string, requestHeaders: BareHeaders, body: BodyInit | null, remote: URL, cache: string | undefined, duplex: string | undefined, signal: AbortSignal | undefined): Promise<BareResponse> {
     return new Response("test");
   }
   connect(remote: URL, protocols: string[], getRequestHeaders: GetRequestHeadersCallback, onMeta: MetaCallback, onReadyState: ReadyStateCallback, webSocketImpl: WebSocketImpl): WebSocket {
     
   }
}
let testclient = new TestClient;


setBareClientImplementation(testclient);
```


and bare-client-custom will take care of the rest
