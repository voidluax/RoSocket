'use strict';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ws-chat-server
 *  ─────────────────────────────────────────────────────────────────────────────
 *  Single-room ("main") WebSocket broadcast server, built for Render.
 *
 *  • Node.js + `ws` — no other dependencies.
 *  • Every connected client lives in the global "main" room.
 *  • Clients send:    { userid, username, message, developer }
 *  • Server overrides `developer` with developers.json (clients never control it).
 *  • Server broadcasts the corrected object to EVERY connected client
 *    (including the sender, which acts as a delivery receipt).
 *  • HTTP `GET /` (and `/health`) return a 200 status payload so Render's
 *    health checks pass.
 *
 *  Render sets `process.env.PORT` automatically. Locally it defaults to 8080.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer, WebSocket } = require('ws');

/* ── Configuration ──────────────────────────────────────────────────────── */

const PORT = Number(process.env.PORT) || 8080; // Render injects PORT
const HOST = '0.0.0.0'; // bind all interfaces (required by Render)
const HEARTBEAT_INTERVAL_MS = 30_000; // protocol-level ping interval
const MAX_PAYLOAD_BYTES = 16 * 1024; // hard frame cap
const MAX_MESSAGE_LENGTH = 2_000; // chat message length cap
const MAX_USERNAME_LENGTH = 50; // display name length cap

const startedAt = Date.now();

/* ── Developer list (loaded once at startup from developers.json) ────────── */

function loadDeveloperIds() {
  const file = path.join(__dirname, 'developers.json');

  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (!Array.isArray(parsed)) {
      throw new Error('developers.json must contain a JSON array of numbers');
    }

    return parsed.filter((id) => typeof id === 'number' && Number.isFinite(id));
  } catch (err) {
    console.error(`[developers] Unable to load developers.json: ${err.message}`);
    console.error('[developers] Continuing with an EMPTY developer list.');
    return [];
  }
}

const developerIds = loadDeveloperIds();

/* ── Status payload ─────────────────────────────────────────────────────── */

let wss; // set below; referenced inside the HTTP handler

function statusBody() {
  return {
    ok: true,
    service: 'ws-chat-server',
    room: 'main',
    clients: wss ? wss.clients.size : 0,
    uptime: Math.round((Date.now() - startedAt) / 1000),
  };
}

/* ── HTTP server (health check for Render + friendly root response) ─────── */

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(statusBody()));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(
    JSON.stringify({
      error: 'not_found',
      message: 'Use a WebSocket client on this host. GET / or GET /health for status.',
    }),
  );
});

/* ── WebSocket server (shares the same port via HTTP upgrade) ────────────── */

wss = new WebSocketServer({ server, maxPayload: MAX_PAYLOAD_BYTES });

function sendError(ws, code, detail) {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(JSON.stringify({ type: 'error', error: code, message: detail }));
  } catch {
    /* socket died mid-send; ignore */
  }
}

/**
 * Broadcast a chat object to every client in the single "main" room.
 * The sender also receives it back (delivery receipt).
 */
function broadcast(payload) {
  const frame = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(frame);
      } catch (err) {
        console.error(`[broadcast] send failed: ${err.message}`);
      }
    }
  }
}

function handleMessage(ws, data, isBinary) {
  if (isBinary) {
    return sendError(ws, 'binary_not_supported', 'Send JSON text frames only.');
  }

  // 1. Parse ────────────────────────────────────────────────────────────────
  let payload;
  try {
    payload = JSON.parse(data.toString('utf8'));
  } catch {
    return sendError(ws, 'invalid_json', 'Message must be valid JSON.');
  }

  // 2. Shape ────────────────────────────────────────────────────────────────
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendError(ws, 'invalid_payload', 'Message must be a JSON object.');
  }

  const { userid, username, message } = payload;

  if (typeof userid !== 'number' || !Number.isFinite(userid)) {
    return sendError(ws, 'invalid_userid', '"userid" must be a finite number.');
  }

  if (
    typeof username !== 'string' ||
    username.trim().length === 0 ||
    username.length > MAX_USERNAME_LENGTH
  ) {
    return sendError(
      ws,
      'invalid_username',
      `"username" must be a non-empty string (max ${MAX_USERNAME_LENGTH} chars).`,
    );
  }

  if (typeof message !== 'string' || message.length === 0) {
    return sendError(ws, 'invalid_message', '"message" must be a non-empty string.');
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return sendError(
      ws,
      'message_too_long',
      `"message" is limited to ${MAX_MESSAGE_LENGTH} characters.`,
    );
  }

  // 3. Build the authoritative outbound object — the `developer` field sent
  //    by the client is ALWAYS discarded and recomputed on the server.
  const outbound = {
    userid,
    username: username.trim(),
    message,
    developer: developerIds.includes(userid),
  };

  broadcast(outbound);
}

/* ── Connection handling ─────────────────────────────────────────────────── */

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[+] connected  ${ip}  (${wss.clients.size} online)`);

  ws.on('message', (data, isBinary) => {
    try {
      handleMessage(ws, data, isBinary);
    } catch (err) {
      console.error(`[handleMessage] unexpected error: ${err.message}`);
      sendError(ws, 'internal_error', 'Something went wrong while handling your message.');
    }
  });

  ws.on('close', () => {
    console.log(`[-] disconnected (${wss.clients.size} online)`);
  });

  ws.on('error', (err) => {
    console.error(`[ws error] ${err.message}`);
  });
});

wss.on('error', (err) => {
  console.error(`[wss error] ${err.message}`);
});

/* ── Heartbeat: terminate stale connections (important on free hosts) ────── */

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      ws.terminate();
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      /* ignore */
    }
  }
}, HEARTBEAT_INTERVAL_MS);

wss.on('close', () => clearInterval(heartbeat));

/* ── Startup & graceful shutdown ─────────────────────────────────────────── */

server.listen(PORT, HOST, () => {
  console.log('──────────────────────────────────────────────');
  console.log('  ws-chat-server — room: main');
  console.log(`  HTTP + WS listening on http://${HOST}:${PORT}`);
  console.log(`  developer ids: ${developerIds.length ? developerIds.join(', ') : '(none)'}`);
  console.log('──────────────────────────────────────────────');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[fatal] port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error(`[server error] ${err.message}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n[shutdown] ${signal} received — closing connections…`);
    clearInterval(heartbeat);
    for (const ws of wss.clients) {
      try {
        ws.close(1001, 'server shutting down');
      } catch {
        /* ignore */
      }
    }
    wss.close(() => server.close(() => process.exit(0)));
    // Force-exit if sockets linger
    setTimeout(() => process.exit(0), 3000).unref();
  });
}
