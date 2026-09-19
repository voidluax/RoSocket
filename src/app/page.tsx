import type { ReactNode } from "react";
import {
  BadgeCheck,
  FileJson,
  HeartPulse,
  Info,
  ListPlus,
  Radio,
  Server,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import Hero from "@/components/hero";
import SectionShell from "@/components/section-shell";
import CodeBlock from "@/components/code-block";
import ChatDemo from "@/components/chat-demo";
import ClientSnippets from "@/components/client-snippets";

/* ── small primitives ─────────────────────────────────────────────────────── */

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[0.86em] text-emerald-300">
      {children}
    </code>
  );
}

function FieldRow({
  name,
  type,
  children,
}: {
  name: string;
  type: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5 border-t border-white/[0.07] py-4 md:grid-cols-[130px_80px_1fr] md:gap-6">
      <div className="font-mono text-[13px] text-emerald-300">{name}</div>
      <div className="font-mono text-[12px] text-zinc-500">{type}</div>
      <div className="text-[13px] leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}

function Note({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-5">
      <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.2em] text-emerald-300 uppercase">
        <Icon size={13} />
        {title}
      </p>
      <div className="mt-2.5 text-[13px] leading-relaxed text-zinc-400">{children}</div>
    </div>
  );
}

function MockMessage({
  name,
  id,
  dev,
  children,
}: {
  name: string;
  id: number;
  dev?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-t border-white/[0.06] py-3.5 first:border-t-0">
      <div
        className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-semibold"
        style={{
          background: `hsl(${(id * 47) % 360} 45% 16%)`,
          color: `hsl(${(id * 47) % 360} 75% 70%)`,
        }}
      >
        {name.slice(0, 2)}
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-zinc-200">{name}</span>
          <span className="font-mono text-[10px] text-zinc-600">#{id}</span>
          {dev ? (
            <span className="inline-flex translate-y-px items-center gap-1 rounded bg-cyan-300/10 px-1.5 py-px font-mono text-[9px] tracking-[0.14em] text-cyan-300 uppercase">
              <BadgeCheck size={10} />
              dev
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[13px] text-zinc-400">{children}</p>
      </div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

const NAV = [
  ["Connect", "#connect"],
  ["Send", "#send"],
  ["Receive", "#receive"],
  ["Live demo", "#demo"],
  ["Clients", "#clients"],
  ["Deploy", "#deploy"],
] as const;

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-x-clip">
      {/* top nav */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#05050a]/75 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <a href="#" className="flex items-center gap-2.5 font-mono text-[13px] text-zinc-200">
            <SquareTerminal size={15} className="text-emerald-400" />
            ws-chat-server
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-zinc-500 uppercase">
              v1
            </span>
          </a>
          <div className="hidden items-center gap-6 text-[12.5px] text-zinc-500 md:flex">
            {NAV.map(([label, href]) => (
              <a key={href} href={href} className="transition hover:text-zinc-200">
                {label}
              </a>
            ))}
          </div>
          <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] py-1 pr-3 pl-2 font-mono text-[10px] tracking-wider text-emerald-300">
            <span className="animate-pulse-dot size-1.5 rounded-full bg-emerald-400" />
            room: main
          </span>
        </div>
      </nav>

      <Hero />

      {/* 01 — CONNECT */}
      <SectionShell
        id="connect"
        index="01 / CONNECT"
        title="Open the socket"
        intro={
          <>
            One endpoint serves both HTTP (health) and WebSocket (upgrade). Connecting{" "}
            <em>is</em> joining — every socket lands in the single room{" "}
            <InlineCode>&quot;main&quot;</InlineCode> the moment it opens.
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <CodeBlock lang="txt" title="render — production" code={`wss://your-service.onrender.com`} />
            <CodeBlock lang="txt" title="local development" code={`ws://localhost:8080`} />
          </div>

          <CodeBlock
            lang="bash"
            title="health check — what render pings"
            code={`curl https://your-service.onrender.com/

# → 200 OK
{ "ok": true, "service": "ws-chat-server", "room": "main", "clients": 3, "uptime": 9134 }`}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Note icon={HeartPulse} title="health route">
              <InlineCode>GET /</InlineCode> (and <InlineCode>/health</InlineCode>) return a
              JSON status payload. Render&#39;s health check is pointed there in{" "}
              <InlineCode>render.yaml</InlineCode> — zero config needed.
            </Note>
            <Note icon={ShieldCheck} title="tls">
              On Render always use <InlineCode>wss://</InlineCode> — TLS is terminated at
              their edge and browsers reject <InlineCode>ws://</InlineCode> from secure
              pages.
            </Note>
            <Note icon={Server} title="port">
              Render injects <InlineCode>PORT</InlineCode> automatically; the server binds{" "}
              <InlineCode>0.0.0.0</InlineCode> and falls back to{" "}
              <InlineCode>8080</InlineCode> locally.
            </Note>
          </div>
        </div>
      </SectionShell>

      {/* 02 — SEND */}
      <SectionShell
        id="send"
        index="02 / SEND"
        title="Send a message"
        intro={
          <>
            Client → server frames are JSON text. Exactly four fields — nothing else is
            read, nothing else is stored.
          </>
        }
      >
        <div className="space-y-8">
          <div className="rounded-xl border border-white/[0.09] bg-white/[0.015] px-5 py-1.5">
            <div className="grid gap-1.5 py-3 font-mono text-[10px] tracking-[0.22em] text-zinc-600 uppercase md:grid-cols-[130px_80px_1fr] md:gap-6">
              <span>field</span>
              <span>type</span>
              <span>server behavior</span>
            </div>
            <FieldRow name="userid" type="number">
              Required. Any unique number your app assigns to the user. This is the value
              the developer check runs against.
            </FieldRow>
            <FieldRow name="username" type="string">
              Required. Non-empty display name, max 50 characters. The server trims
              whitespace before broadcasting.
            </FieldRow>
            <FieldRow name="message" type="string">
              Required. Non-empty chat text, max 2000 characters. Broadcast verbatim.
            </FieldRow>
            <FieldRow name="developer" type="boolean">
              <span className="text-amber-300">Ignored.</span> Clients may send anything —
              the server discards it and recomputes the field from{" "}
              <InlineCode>developers.json</InlineCode> on every single frame.
            </FieldRow>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock
              lang="json"
              title="client sends — even lying about developer"
              code={`{
  "userid": 7,
  "username": "Nova",
  "message": "hello, main",
  "developer": true
}`}
            />
            <CodeBlock
              lang="json"
              title="invalid frames get this back — sender only"
              code={`{
  "type": "error",
  "error": "invalid_json",
  "message": "Message must be valid JSON."
}`}
            />
          </div>
          <p className="text-[12.5px] leading-relaxed text-zinc-500">
            Error codes: <InlineCode>invalid_json</InlineCode>,{" "}
            <InlineCode>invalid_payload</InlineCode>, <InlineCode>invalid_userid</InlineCode>,{" "}
            <InlineCode>invalid_username</InlineCode>, <InlineCode>invalid_message</InlineCode>,{" "}
            <InlineCode>message_too_long</InlineCode>, <InlineCode>binary_not_supported</InlineCode>.
            Invalid frames are never broadcast.
          </p>
        </div>
      </SectionShell>

      {/* 03 — RECEIVE */}
      <SectionShell
        id="receive"
        index="03 / RECEIVE"
        title="Receive the broadcast"
        intro={
          <>
            Every valid frame is rebroadcast to <em>every</em> socket in the room —
            including the sender, which can treat its own echo as a delivery receipt.
          </>
        }
      >
        <div className="space-y-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock
              lang="json"
              title="every client receives — corrected by the server"
              code={`{
  "userid": 1,
  "username": "Aria",
  "message": "deploying now",
  "developer": true
}`}
            />
            <CodeBlock
              lang="js"
              title="how the flag is decided — server.js"
              code={`// the client-sent "developer" value never survives
const outbound = {
  userid,
  username: username.trim(),
  message,
  developer: developerIds.includes(userid),
};
broadcast(outbound);   // → every socket in room "main"`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/[0.09] bg-white/[0.015] p-5">
              <p className="mb-2 font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
                your ui, your badge
              </p>
              <MockMessage name="Aria" id={1} dev>
                deploying now — <InlineCode>{'"developer": true'}</InlineCode>, so my client
                renders this cyan check.
              </MockMessage>
              <MockMessage name="Max" id={2} dev>
                id 2 is also in <InlineCode>developers.json</InlineCode>.
              </MockMessage>
              <MockMessage name="Nova" id={7}>
                I sent <InlineCode>{'"developer": true'}</InlineCode> — the server stripped
                it, so no badge for me.
              </MockMessage>
            </div>

            <div className="space-y-4">
              <Note icon={BadgeCheck} title="developer: boolean">
                The field is a strict JSON boolean — only{" "}
                <InlineCode>true</InlineCode> or <InlineCode>false</InlineCode>. The server
                never sends emojis, badges, or special characters. What a badge{" "}
                <em>looks like</em> (icon, chip, glow) is entirely your client&#39;s
                decision.
              </Note>
              <Note icon={Radio} title="stateless">
                Nothing is persisted — no history, no roster. Clients render frames as they
                arrive and handle their own reconnects.
              </Note>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 04 — LIVE DEMO */}
      <SectionShell
        id="demo"
        index="04 / LIVE DEMO"
        title="Try it right now"
        intro={
          <>
            A full working client for the protocol. Start the server locally or paste your
            deployed Render URL — then open this page in a second tab and talk between
            tabs. Pick a <span className="text-cyan-300">developer identity</span> to watch
            the server attach the flag.
          </>
        }
      >
        <div className="space-y-5">
          <ChatDemo />
          <p className="text-[12.5px] leading-relaxed text-zinc-500">
            Outbound frames always leave as{" "}
            <InlineCode>{'"developer": false'}</InlineCode> — the value you see come back
            is 100% server-computed. That&#39;s the whole point.
          </p>
        </div>
      </SectionShell>

      {/* 05 — CLIENTS */}
      <SectionShell
        id="clients"
        index="05 / CLIENTS"
        title="Connect from anything"
        intro={
          <>
            If it speaks WebSocket, it can join room <InlineCode>&quot;main&quot;</InlineCode>{" "}
            — browsers, bots, game engines, shells.
          </>
        }
      >
        <ClientSnippets />
      </SectionShell>

      {/* 06 — DEPLOY */}
      <SectionShell
        id="deploy"
        index="06 / DEPLOY"
        title="Deploy on Render"
        intro={
          <>
            The <InlineCode>ws-server/</InlineCode> folder in this repo is the complete,
            self-contained project. Push it as its own repository and Render does the rest.
          </>
        }
      >
        <div className="space-y-8">
          <ol className="space-y-0">
            {[
              [
                "Push the folder to Git",
                "Copy ws-server/ into its own repo (it has no ties to this monorepo) and push to GitHub or GitLab.",
              ],
              [
                "New → Blueprint",
                "Point Render at the repo. It reads render.yaml and provisions the Web Service with the exact commands below — or create a Web Service by hand with the same values.",
              ],
              [
                "Copy your wss URL",
                "Render injects PORT and TLS. Your endpoint is wss://<service>.onrender.com — paste it into the live demo above.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="relative flex gap-4 pb-6">
                <div className="flex flex-col items-center">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.07] font-mono text-[11px] text-emerald-300">
                    {i + 1}
                  </span>
                  {i < 2 ? <span className="mt-1 w-px flex-1 bg-white/[0.09]" /> : null}
                </div>
                <div className="pt-1">
                  <p className="text-[14px] font-semibold text-zinc-200">{t}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">{d}</p>
                </div>
              </li>
            ))}
          </ol>

          <CodeBlock
            lang="yaml"
            title="render.yaml — the blueprint"
            code={`services:
  - type: web
    name: ws-chat-server
    runtime: node          # Node.js Web Service
    plan: free             # upgrade to "starter" for always-on
    region: oregon
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /     # server answers GET / with 200 JSON
    autoDeploy: true
    # rootDir: ws-server   # monorepos only: uncomment`}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CodeBlock
              lang="bash"
              title="run it yourself"
              code={`cd ws-server
npm install
npm start          # → listening on :8080

curl localhost:8080/
# {"ok":true,"service":"ws-chat-server","room":"main", ...}`}
            />
            <div className="space-y-4">
              <CodeBlock
                lang="json"
                title="developers.json — who gets the badge"
                code={`[
  1,
  2
]`}
              />
              <Note icon={ListPlus} title="managing developers">
                Edit <InlineCode>developers.json</InlineCode> — any numeric userid in the
                array gets <InlineCode>true</InlineCode>. The file is read at startup, so
                restart (or redeploy) after changing it.
              </Note>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* footer */}
      <footer className="border-t border-white/[0.07]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.25em] text-zinc-500 uppercase">
              <FileJson size={13} className="text-emerald-400" />
              complete file tree
            </p>
            <pre className="mt-4 font-mono text-[12px] leading-relaxed text-zinc-500">
{`ws-server/
├── package.json      # start script + ws dependency
├── server.js         # http health + ws room: main
├── developers.json   # [ 1, 2 ]
├── render.yaml       # blueprint for Render
└── README.md         # the full API reference`}
            </pre>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[13px] text-zinc-400">
              Node.js · ws · Render Blueprint · MIT
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-600">
              four fields in — booleans out. no emojis were harmed.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
