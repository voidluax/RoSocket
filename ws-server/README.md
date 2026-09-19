# ws-chat-server

A single-room (`"main"`) WebSocket broadcast server written in **Node.js** with the [`ws`](https://github.com/websockets/ws) library. Every connected client joins the same global room; every valid message is validated, corrected, and broadcast to **all** connected clients. Ready to deploy on **Render** as a Web Service.

---

## Repository contents

| File                 | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `package.json`       | Project metadata, `ws` dependency, and the `start` script.              |
| `server.js`          | The entire server: HTTP health check + WebSocket room + broadcasting.   |
| `developers.json`    | Array of numeric UserIDs that are granted the `developer: true` flag.   |
| `render.yaml`        | Render Blueprint (build + start commands, health check path).           |
| `.gitignore`         | Ignores `node_modules`, logs, and env files.                            |

## Quick start (local)

```bash
git clone <your-repo>        # or copy this folder
cd ws-server
npm install
npm start
# → HTTP + WS listening on http://0.0.0.0:8080
```

Verify the health check:

```bash
curl http://localhost:8080/
# {"ok":true,"service":"ws-chat-server","room":"main","clients":0,"uptime":3}
```

## Deploying on Render

1. Push this folder to a Git repository.
2. Render Dashboard → **New → Blueprint** → select the repo. Render reads `render.yaml` and provisions the Web Service.
   _(Or create a **Web Service** manually with build command `npm install` and start command `npm start`.)_
3. Render injects `PORT` automatically — `server.js` already reads it. Your service's health check (`GET /`) is answered by the built-in HTTP route.
4. When the deploy is live, your WebSocket URL is:
   **`wss://<your-service-name>.onrender.com`**

> **Monorepo note:** if this folder is a subdirectory of a bigger repo, uncomment the `rootDir: ws-server` line inside `render.yaml`.
>
> **Free plan note:** free Web Services spin down after inactivity and the first connection after idle takes a few seconds while Render starts the instance — this is hosting behavior, not a server issue.

---

# API Documentation

## 1. Connecting

The same port serves HTTP (health check) and WebSocket (upgrade). Connect your WebSocket client to the service root — no path or auth is required.

| Environment      | WebSocket URL                        |
| ---------------- | ------------------------------------ |
| Render (deployed) | `wss://<your-service-name>.onrender.com` |
| Local development | `ws://localhost:8080`                 |

- `wss://` is WebSocket over TLS. Render terminates TLS for you — always use `wss://` (not `ws://`) against `*.onrender.com`.
- Any URL path works for the upgrade (the room is global), but `/` is the canonical choice.
- All clients land in the single room `"main"` the moment they connect. There is no join/leave protocol — connecting *is* joining.

## 2. Sending a message (client → server)

Send a **JSON text frame** with this exact shape:

```json
{
  "userid": 0,
  "username": "string",
  "message": "string",
  "developer": false
}
```

| Field        | Type      | Rules                                                                                                |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| `userid`     | `number`  | Required. Any unique number your app assigns to the user. Also used by the server for the dev check. |
| `username`   | `string`  | Required. Non-empty, max 50 characters (trimmed by the server).                                       |
| `message`    | `string`  | Required. Non-empty, max 2000 characters.                                                             |
| `developer`  | `boolean` | **Ignored.** Clients may send anything here — the server always recomputes and overrides this field.  |

If the frame is invalid (unparsable JSON, wrong types, empty/oversized fields), it is **not** broadcast. Instead, the server replies to that sender only with an error frame (see §4).

## 3. Receiving a message (server → all clients)

Every valid message is broadcast to **every** connected client, including the sender (which can treat its own message returning as a delivery receipt):

```json
{
  "userid": 1,
  "username": "Aria",
  "message": "ship it",
  "developer": true
}
```

| Field        | Type      | Description                                                              |
| ------------ | --------- | ------------------------------------------------------------------------ |
| `userid`     | `number`  | Same id the sender supplied.                                             |
| `username`   | `string`  | Sender's display name (trimmed).                                         |
| `message`    | `string`  | The chat message, unchanged.                                             |
| `developer`  | `boolean` | **Server-computed.** `true` iff `userid` is listed in `developers.json`. |

> The server is stateless: it stores no history and sends nothing on connect. Clients render messages as they arrive.

## 4. Error frames (server → sender only)

Malformed input never reaches other clients. The sender receives:

```json
{ "type": "error", "error": "invalid_json", "message": "Message must be valid JSON." }
```

Possible `error` codes: `invalid_json`, `invalid_payload`, `invalid_userid`, `invalid_username`, `invalid_message`, `message_too_long`, `binary_not_supported`, `internal_error`. Client code that parses every incoming frame as a chat message should first check for the presence of `"type": "error"`.

## 5. How the `developer` field works

- `developers.json` contains an array of numeric UserIDs — for example `[1, 2]`. It is read **once at server startup**. To change it: edit the file and restart (redeploy on Render).
- On every inbound message the server runs the equivalent of:

  ```js
  developer: developerIds.includes(payload.userid)
  ```

  The value the client sent for `developer` is **never forwarded** — impersonation is impossible. A client sending `"developer": true` with `userid: 99` will be broadcast with `"developer": false` (unless `99` is in the list).
- The field is a strict JSON boolean: only `true` or `false`. The server **never** emits emojis, special characters, or alternate truthy values in this field.

### Rendering a developer badge in your client

Use the boolean however your UI wants — icon, chip, color, animation. Pure client concern:

```js
socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.developer === true) {
    // your app renders a badge here — e.g. a checkmark icon next to msg.username.
    // The server guarantees: true/false only, no emoji characters.
  }
});
```

```html
<!-- example markup a client might build: username + badge when developer === true -->
<span class="user">Aria <svg class="dev-badge" aria-label="developer"><!-- any icon you like --></svg></span>
```

Game engines can do the same: check the boolean and draw a badge icon beside the user's name.

## 6. Full example exchange

**Client sends** (note: it *claims* `developer: true` — it is not trusted):

```json
{ "userid": 7, "username": "Nova", "message": "hello main", "developer": true }
```

**Server broadcasts to everyone** (`7` is not in `developers.json`, so the flag is stripped):

```json
{ "userid": 7, "username": "Nova", "message": "hello main", "developer": false }
```

**A developer sends** (`1` *is* in `developers.json`, so even `false` becomes `true`):

```json
{ "userid": 1, "username": "Aria", "message": "deploying now", "developer": false }
```

→ broadcast:

```json
{ "userid": 1, "username": "Aria", "message": "deploying now", "developer": true }
```

## 7. Client examples

### Browser / JavaScript (any frontend framework)

```js
const socket = new WebSocket('wss://your-service.onrender.com');

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({
    userid: 7,
    username: 'Nova',
    message: 'hello main',
    developer: false, // server overrides this
  }));
});

socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'error') return console.warn('server error:', msg.error);
  console.log(`[${msg.developer ? 'DEV' : 'user'}] ${msg.username}: ${msg.message}`);
});

socket.addEventListener('close', () => console.log('disconnected from main'));
```

### Node.js (server-to-server bots, tooling)

```js
const WebSocket = require('ws');

const ws = new WebSocket('wss://your-service.onrender.com');

ws.on('open', () => {
  ws.send(JSON.stringify({ userid: 7, username: 'node-bot', message: 'online', developer: false }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type !== 'error') console.log(`${msg.username}: ${msg.message}`);
});
```

### Python (`pip install websocket-client`)

```python
import json
from websocket import create_connection

ws = create_connection("wss://your-service.onrender.com")
ws.send(json.dumps({"userid": 7, "username": "py-bot", "message": "hi", "developer": False}))

while True:
    msg = json.loads(ws.recv())
    if msg.get("type") == "error":
        continue
    print(f"{'[DEV] ' if msg['developer'] else ''}{msg['username']}: {msg['message']}")
```

### Anything else

Any WebSocket-capable client works — Unity (`ClientWebSocket`), Godot (`WebSocketPeer`), Unreal, mobile (Starscream, OkHttp), `wscat` for quick shells:

```bash
npx wscat -c wss://your-service.onrender.com
> {"userid":1,"username":"Aria","message":"test","developer":false}
```

## Operational notes

- **Limits:** frames capped at 16 KB; messages at 2000 chars; usernames at 50 chars. Heartbeat ping every 30 s reaps dead sockets.
- **No persistence:** chat history is not stored; restart wipes nothing because nothing is stored.
- **No authentication:** `userid` + `username` are self-declared by design. Add your own auth layer if you need verified identities.
- **Scaling:** one process = one room. Broadcasting happens in memory; run a single instance on Render.
