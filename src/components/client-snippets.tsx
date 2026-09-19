"use client";

import { useState } from "react";
import CodeBlock from "./code-block";

const TABS = [
  {
    id: "browser",
    label: "Browser JS",
    lang: "js",
    code: `// any browser or frontend framework

const socket = new WebSocket("wss://your-service.onrender.com");

socket.addEventListener("open", () => {
  socket.send(JSON.stringify({
    userid: 7,               // any unique number your app assigns
    username: "Nova",
    message: "hello, main",
    developer: false,        // ignored — the server recomputes it
  }));
});

socket.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "error") return;   // the server rejected a frame YOU sent

  if (msg.developer === true) {
    // render your developer badge / icon next to msg.username
    // the server only ever sends true or false — no emojis
  }

  console.log(\`\${msg.username}: \${msg.message}\`);
});

// reconnecting after a drop is the client's job
socket.addEventListener("close", () => {
  setTimeout(connect, 1500);          // however you want to handle it
});`,
  },
  {
    id: "node",
    label: "Node.js",
    lang: "js",
    code: `// bots, tooling, server-to-server — npm install ws

const WebSocket = require("ws");

const socket = new WebSocket("wss://your-service.onrender.com");

socket.on("open", () => {
  socket.send(JSON.stringify({
    userid: 7,
    username: "node-bot",
    message: "hello from node",
    developer: false,                 // server overrides this
  }));
});

socket.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type === "error") return console.warn("rejected:", msg.error);

  const badge = msg.developer ? " [developer]" : "";
  console.log(\`\${msg.username}\${badge}: \${msg.message}\`);
});`,
  },
  {
    id: "python",
    label: "Python",
    lang: "python",
    code: `# pip install websocket-client

import json
from websocket import create_connection

ws = create_connection("wss://your-service.onrender.com")

ws.send(json.dumps({
    "userid": 7,
    "username": "py-bot",
    "message": "hi from python",
    "developer": False,               # server decides
}))

while True:
    msg = json.loads(ws.recv())       # every frame in room "main" lands here
    if msg.get("type") == "error":    # rejection, delivered only to the sender
        print("rejected:", msg["error"])
        continue
    badge = " [developer]" if msg["developer"] else ""
    print(f"{msg['username']}{badge}: {msg['message']}")`,
  },
  {
    id: "godot",
    label: "Godot",
    lang: "gdscript",
    code: `# Godot 4 — WebSocketPeer; same idea in Unity/Unreal
extends Node

var socket := WebSocketPeer.new()

func _ready() -> void:
  socket.connect_to_url("wss://your-service.onrender.com")

func _process(_delta: float) -> void:
  socket.poll()
  if socket.get_ready_state() != WebSocketPeer.STATE_OPEN:
    return
  while socket.get_available_packet_count() > 0:
    var text := socket.get_packet().get_string_from_utf8()
    var msg = JSON.parse_string(text)
    if msg is Dictionary and not msg.has("type"):
      var is_dev = msg.get("developer", false)
      # if is_dev: show your badge icon next to the username
      print(msg.username, ": ", msg.message)

func send_chat(userid: int, username: String, message: String) -> void:
  socket.send_text(JSON.stringify({
    "userid": userid,
    "username": username,
    "message": message,
    "developer": false        # anything here is ignored server-side
  }))`,
  },
  {
    id: "shell",
    label: "wscat",
    lang: "shell",
    code: `# quickest possible client — a shell

npx wscat -c wss://your-service.onrender.com

# connected! paste a frame:
{"userid":2,"username":"Max","message":"hello from wscat","developer":false}

# and you'll see it come right back, plus everyone else's frames:
< {"userid":2,"username":"Max","message":"hello from wscat","developer":true}`,
  },
];

export default function ClientSnippets() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div>
      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-md px-3.5 py-1.5 font-mono text-[11.5px] transition ${
              active === t.id
                ? "bg-emerald-400/15 text-emerald-300"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock key={tab.id} code={tab.code} lang={tab.lang} title={`${tab.label} client`} />
    </div>
  );
}
