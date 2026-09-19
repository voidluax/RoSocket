"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BadgeCheck, Send, Terminal, Unplug, Zap } from "lucide-react";

type Status = "idle" | "connecting" | "open" | "closed" | "error";

type LogItem = {
  id: number;
  kind: "sys" | "chat";
  at: number;
  text?: string;
  sysError?: boolean;
  userid?: number;
  username?: string;
  message?: string;
  developer?: boolean;
  mine?: boolean;
  raw?: string;
};

type OutboundPayload = {
  userid: number;
  username: string;
  message: string;
  developer: boolean;
};

const GUEST_NAMES = ["Nova", "Quinn", "Echo", "Rio", "Juno", "Sol", "Mika", "Tala"];

const STATUS_META: Record<Status, { dot: string; label: string }> = {
  idle: { dot: "bg-zinc-500", label: "not connected" },
  connecting: { dot: "animate-pulse bg-amber-400", label: "connecting…" },
  open: { dot: "animate-pulse-dot bg-emerald-400", label: "online" },
  closed: { dot: "bg-zinc-500", label: "disconnected" },
  error: { dot: "bg-rose-500", label: "connection error" },
};

function hueFor(userid: number) {
  const h = Math.abs(userid * 47) % 360;
  return `hsl(${h} 72% 68%)`;
}

export default function ChatDemo() {
  const [url, setUrl] = useState("ws://localhost:8080");
  const [userId, setUserId] = useState("7");
  const [username, setUsername] = useState("Nova");
  const [status, setStatus] = useState<Status>("idle");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [draft, setDraft] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingEchoRef = useRef<OutboundPayload | null>(null);
  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const idCounter = useRef(0);

  const pushLog = useCallback((item: Omit<LogItem, "id" | "at">) => {
    setLogs((prev) => {
      const next = [...prev, { ...item, id: ++idCounter.current, at: Date.now() }];
      return next.length > 200 ? next.slice(next.length - 200) : next;
    });
  }, []);

  const pushSys = useCallback(
    (text: string, sysError = false) => pushLog({ kind: "sys", text, sysError }),
    [pushLog],
  );

  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, []);

  const connect = useCallback(() => {
    disconnect();
    let target = url.trim();
    if (!/^wss?:\/\//i.test(target)) target = `ws://${target}`;

    setStatus("connecting");
    const ws = new WebSocket(target);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("open");
      pushSys(`connected to ${target} — you are now in room "main"`);
    };

    ws.onmessage = (ev: MessageEvent) => {
      const raw = String(ev.data);
      try {
        const data = JSON.parse(raw);
        if (data && data.type === "error") {
          pushSys(`server rejected a frame: ${data.error} — ${data.message}`, true);
          return;
        }
        const pending = pendingEchoRef.current;
        const mine =
          !!pending &&
          data.userid === pending.userid &&
          data.username === pending.username &&
          data.message === pending.message;
        if (mine) pendingEchoRef.current = null;

        pushLog({
          kind: "chat",
          userid: data.userid,
          username: data.username,
          message: data.message,
          developer: data.developer === true,
          mine,
          raw,
        });
      } catch {
        pushSys("received a non-JSON frame", true);
      }
    };

    ws.onerror = () => setStatus("error");

    ws.onclose = () => {
      setStatus((s) => (s === "error" ? "error" : "closed"));
      pushSys("connection closed — you left room \"main\"");
      wsRef.current = null;
    };
  }, [disconnect, pushLog, pushSys, url]);

  const send = useCallback(() => {
    const ws = wsRef.current;
    const text = draft.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !text) return;

    const payload: OutboundPayload = {
      userid: Number(userId) || 0,
      username: username.trim() || "anonymous",
      message: text.slice(0, 2000),
      developer: false, // the server ignores and overrides this
    };
    pendingEchoRef.current = payload;
    ws.send(JSON.stringify(payload));
    setDraft("");
  }, [draft, userId, username]);

  useEffect(() => () => disconnect(), [disconnect]);

  useEffect(() => {
    const box = logBoxRef.current;
    if (box) box.scrollTo({ top: box.scrollHeight });
  }, [logs]);

  const isOpen = status === "open";
  const meta = STATUS_META[status];

  return (
    <div className="rounded-2xl bg-gradient-to-b from-emerald-400/30 via-white/10 to-white/5 p-px">
      <div className="overflow-hidden rounded-[calc(1rem-1px)] bg-[#0a0a12]">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-5 py-3">
          <div className="flex items-center gap-2.5 font-mono text-[10.5px] tracking-[0.22em] text-zinc-400 uppercase">
            <Terminal size={13} className="text-emerald-400" />
            live client · room &quot;main&quot;
          </div>
          <span className="flex items-center gap-2 rounded-full border border-white/10 py-1 pr-3 pl-2 font-mono text-[10.5px] tracking-wider text-zinc-300">
            <span className={`size-2 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        {/* connection config */}
        <div className="space-y-3 border-b border-white/[0.07] px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row">
            <label className="flex-1">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                server url
              </span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                spellCheck={false}
                placeholder="ws://localhost:8080 or wss://your-service.onrender.com"
                className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2.5 font-mono text-[12.5px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
              />
            </label>
            <label className="md:w-28">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                userid
              </span>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2.5 font-mono text-[12.5px] text-zinc-200 outline-none focus:border-emerald-400/50"
              />
            </label>
            <label className="md:w-40">
              <span className="mb-1.5 block font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={50}
                className="w-full rounded-lg border border-white/12 bg-black/40 px-3 py-2.5 font-mono text-[12.5px] text-zinc-200 outline-none focus:border-emerald-400/50"
              />
            </label>
            <div className="flex items-end">
              {isOpen || status === "connecting" ? (
                <button
                  onClick={disconnect}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-[13px] font-medium text-rose-300 transition hover:bg-rose-400/20 md:w-auto"
                >
                  <Unplug size={14} />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connect}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-5 py-2.5 text-[13px] font-semibold text-emerald-950 transition hover:bg-emerald-300 md:w-auto"
                >
                  <Zap size={14} />
                  Connect
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
              quick identity
            </span>
            {[
              { id: "1", name: "Aria", dev: true },
              { id: "2", name: "Max", dev: true },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setUserId(p.id);
                  setUsername(p.name);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-cyan-300/25 bg-cyan-300/[0.07] px-2.5 py-1 font-mono text-[11px] text-cyan-300 transition hover:bg-cyan-300/[0.14]"
              >
                <BadgeCheck size={11} />
                {p.name} · id {p.id}
              </button>
            ))}
            <button
              onClick={() => {
                setUserId(String(100 + Math.floor(Math.random() * 900)));
                setUsername(GUEST_NAMES[Math.floor(Math.random() * GUEST_NAMES.length)]);
              }}
              className="rounded-md border border-white/12 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] text-zinc-400 transition hover:bg-white/[0.09] hover:text-zinc-200"
            >
              random guest
            </button>
          </div>
        </div>

        {/* message log */}
        <div ref={logBoxRef} className="chat-scroll h-80 space-y-2 overflow-y-auto bg-black/30 p-5">
          {logs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="font-mono text-[11px] tracking-[0.25em] text-zinc-600 uppercase">
                no frames yet
              </p>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-zinc-500">
                Run <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[11px] text-emerald-300">cd ws-server && npm install && npm start</code>, press
                Connect, and type a message. Open this page in a second tab —
                both tabs share room &quot;main&quot;.
              </p>
            </div>
          ) : (
            logs.map((item) =>
              item.kind === "sys" ? (
                <p
                  key={item.id}
                  className={`py-0.5 text-center font-mono text-[10.5px] tracking-wide ${
                    item.sysError ? "text-rose-400/90" : "text-zinc-600"
                  }`}
                >
                  ── {item.text} ──
                </p>
              ) : (
                <div key={item.id} className={`flex ${item.mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-xl border px-3.5 py-2.5 ${
                      item.mine
                        ? "border-emerald-400/25 bg-emerald-400/[0.08]"
                        : "border-white/[0.09] bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        className="text-[12px] font-semibold"
                        style={{ color: hueFor(item.userid ?? 0) }}
                      >
                        {item.username}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-600">
                        #{item.userid}
                      </span>
                      {item.developer ? (
                        <span
                          className="inline-flex translate-y-[0.5px] items-center gap-1 rounded bg-cyan-300/10 px-1.5 py-px font-mono text-[9px] tracking-[0.14em] text-cyan-300 uppercase"
                          title="developer: true — set by the server"
                        >
                          <BadgeCheck size={10} />
                          dev
                        </span>
                      ) : null}
                      <span className="ml-auto font-mono text-[9.5px] text-zinc-700">
                        {new Date(item.at).toLocaleTimeString([], { hour12: false })}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug break-words whitespace-pre-wrap text-zinc-200">
                      {item.message}
                    </p>
                    {showRaw ? (
                      <p className="mt-1.5 border-t border-white/[0.06] pt-1.5 font-mono text-[9.5px] break-all text-zinc-600">
                        {item.raw}
                      </p>
                    ) : null}
                  </div>
                </div>
              ),
            )
          )}
        </div>

        {/* composer */}
        <div className="border-t border-white/[0.07] bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={!isOpen}
              placeholder={isOpen ? "Message room “main”…" : "Connect first to send frames"}
              className="flex-1 rounded-lg border border-white/12 bg-black/40 px-3.5 py-2.5 text-[13px] text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-emerald-400/50 disabled:opacity-50"
            />
            <span className="hidden font-mono text-[10px] text-zinc-600 md:block">
              {draft.length}/2000
            </span>
            <button
              onClick={send}
              disabled={!isOpen || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-[13px] font-semibold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
              Send
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <label className="flex cursor-pointer items-center gap-2 font-mono text-[10.5px] text-zinc-500 select-none">
              <input
                type="checkbox"
                checked={showRaw}
                onChange={(e) => setShowRaw(e.target.checked)}
                className="size-3 accent-emerald-400"
              />
              show raw frames
            </label>
            <p className="font-mono text-[10.5px] text-zinc-600">
              ws://localhost works even on https pages · remote servers need{" "}
              <span className="text-sky-300">wss://</span> (render gives you this)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
