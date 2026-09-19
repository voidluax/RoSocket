import { ArrowRight, ArrowUpRight, BadgeCheck } from "lucide-react";

/* Message flow diagram: inbound frame → server override → broadcast to all. */
function FlowDiagram() {
  const inbound = [
    "M86 60 C140 60 150 150 198 158",
    "M86 180 H196",
    "M86 300 C140 300 150 210 198 202",
  ];
  const outbound = [
    "M322 158 C370 150 380 60 434 60",
    "M324 180 H434",
    "M322 202 C370 210 380 300 434 300",
  ];

  return (
    <svg viewBox="0 0 520 360" className="h-auto w-full" role="img" aria-label="Message flow: client to server to all clients">
      <defs>
        <radialGradient id="serverGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="260" cy="180" r="105" fill="url(#serverGlow)" />

      {/* connections */}
      {inbound.map((d) => (
        <path key={d} d={d} fill="none" stroke="#3f3f46" strokeWidth="1.4" strokeDasharray="3 7" className="animate-dash-flow" />
      ))}
      {outbound.map((d) => (
        <path key={d} d={d} fill="none" stroke="#3f3f46" strokeWidth="1.4" strokeDasharray="3 7" className="animate-dash-flow" />
      ))}

      {/* highlighted route: developer client A → server → all */}
      <path d={inbound[0]} fill="none" stroke="#34d399" strokeOpacity="0.55" strokeWidth="1.6" strokeDasharray="3 7" className="animate-dash-flow" />
      {outbound.map((d) => (
        <path key={`g${d}`} d={d} fill="none" stroke="#22d3ee" strokeOpacity="0.45" strokeWidth="1.6" strokeDasharray="3 7" className="animate-dash-flow" />
      ))}

      {/* travelling packets */}
      <circle r="3.2" fill="#34d399">
        <animateMotion dur="1.6s" repeatCount="indefinite" path={inbound[0]} />
      </circle>
      <circle r="2.6" fill="#22d3ee">
        <animateMotion dur="1.6s" begin="0.8s" repeatCount="indefinite" path={outbound[0]} />
      </circle>
      <circle r="2.6" fill="#22d3ee">
        <animateMotion dur="1.9s" begin="1.05s" repeatCount="indefinite" path={outbound[1]} />
      </circle>
      <circle r="2.6" fill="#22d3ee">
        <animateMotion dur="2.2s" begin="1.2s" repeatCount="indefinite" path={outbound[2]} />
      </circle>
      <circle r="2.4" fill="#a78bfa">
        <animateMotion dur="2.4s" begin="0.4s" repeatCount="indefinite" path={inbound[2]} />
      </circle>

      {/* client nodes */}
      {[
        { x: 64, y: 60, label: "client · id 1", dev: true },
        { x: 64, y: 180, label: "client · id 7", dev: false },
        { x: 64, y: 300, label: "client · id 42", dev: false },
        { x: 456, y: 60, label: "client · id 9", dev: false },
        { x: 456, y: 180, label: "client · id 21", dev: false },
        { x: 456, y: 300, label: "client · id 77", dev: false },
      ].map((n) => (
        <g key={n.label}>
          <circle cx={n.x} cy={n.y} r="13" fill="#0a0a12" stroke={n.dev ? "#22d3ee" : "#52525b"} strokeWidth={n.dev ? 1.8 : 1.2} />
          <circle cx={n.x} cy={n.y} r="4" fill={n.dev ? "#22d3ee" : "#71717a"} />
          {n.dev ? (
            <g transform={`translate(${n.x + 8}, ${n.y - 14})`}>
              <circle r="6" fill="#0e7490" />
              <path d="M-2.6 0.2l1.8 1.8 3.4-3.6" stroke="#ecfeff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ) : null}
          <text x={n.x} y={n.y + 30} textAnchor="middle" fill="#71717a" fontSize="9.5" fontFamily="ui-monospace, monospace">
            {n.label}
          </text>
        </g>
      ))}

      {/* server node */}
      <rect x="200" y="148" width="120" height="64" rx="14" fill="#0a0a12" stroke="#34d399" strokeOpacity="0.7" strokeWidth="1.4" />
      <text x="260" y="174" textAnchor="middle" fill="#a7f3d0" fontSize="12" fontFamily="ui-monospace, monospace">
        server.js
      </text>
      <text x="260" y="194" textAnchor="middle" fill="#71717a" fontSize="9.5" fontFamily="ui-monospace, monospace">
        room: main · ws
      </text>
    </svg>
  );
}

export default function Hero() {
  return (
    <header className="relative overflow-hidden">
      <div className="bg-blueprint pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-emerald-500/[0.08] blur-[110px]" />
      <div className="pointer-events-none absolute top-24 -right-32 h-72 w-72 rounded-full bg-violet-500/[0.07] blur-[100px]" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-36 pb-20 md:pt-44 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="animate-rise">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] py-1.5 pr-4 pl-2.5">
            <span className="animate-pulse-dot size-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10.5px] tracking-[0.22em] text-emerald-300 uppercase">
              room: main · accepting connections
            </span>
          </div>

          <h1 className="mt-7 text-[clamp(2.5rem,6.5vw,4.3rem)] leading-[1.02] font-semibold tracking-tight text-zinc-100">
            One socket. One room.{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-violet-300 bg-clip-text text-transparent">
              Everyone hears everything.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-zinc-400">
            A broadcast WebSocket API built on Node.js and the{" "}
            <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[12.5px] text-emerald-300">
              ws
            </code>{" "}
            library, deployable to Render as a Web Service. Send four fields —
            the server decides who carries the developer flag. Clients never do.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3.5">
            <a
              href="#demo"
              className="group inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-300"
            >
              Open the live client
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#connect"
              className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:border-white/25 hover:text-white"
            >
              Read the API docs
              <ArrowUpRight size={16} className="text-zinc-500" />
            </a>
          </div>

          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-5">
            {[
              ["1", "global room — no joins, connecting is joining"],
              ["4 → 4", "fields in, fields out — shape never changes"],
              ["0", "emojis on the wire — booleans only"],
            ].map(([big, small]) => (
              <div key={small} className="border-l border-white/12 pl-4">
                <dt className="font-mono text-lg font-semibold text-zinc-100">{big}</dt>
                <dd className="mt-1 text-[11.5px] leading-snug text-zinc-500">{small}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* live frame card */}
        <div className="animate-rise relative" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-emerald-500/10 via-transparent to-violet-500/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a12]/90 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                live frame · broadcast
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-300">
                <BadgeCheck size={12} />
                developer override
              </span>
            </div>

            <div className="p-3">
              <FlowDiagram />
            </div>

            <div className="border-t border-white/[0.07] bg-black/30 px-5 py-4 font-mono text-[11.5px] leading-relaxed">
              <p className="text-zinc-600">{"// broadcast to every client"}</p>
              <p className="mt-1 text-zinc-400">
                {"{ "}
                <span className="text-emerald-300">&quot;userid&quot;</span>
                <span className="text-zinc-500">:</span> <span className="text-cyan-300">1</span>
                <span className="text-zinc-500">,</span>{" "}
                <span className="text-emerald-300">&quot;username&quot;</span>
                <span className="text-zinc-500">:</span> <span className="text-emerald-300">&quot;Aria&quot;</span>
                <span className="text-zinc-500">,</span>
              </p>
              <p className="text-zinc-400">
                {"  "}
                <span className="text-emerald-300">&quot;message&quot;</span>
                <span className="text-zinc-500">:</span> <span className="text-emerald-300">&quot;deploying now&quot;</span>
                <span className="text-zinc-500">,</span>{" "}
                <span className="text-emerald-300">&quot;developer&quot;</span>
                <span className="text-zinc-500">:</span> <span className="text-amber-300">true</span>
                {" }"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
