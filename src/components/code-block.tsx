"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";

/* ── Tiny tokenizer: comments → strings → urls → keywords → bools → numbers ── */

const RULES: Array<[RegExp, string]> = [
  [/\/\/[^\n]*|#[^\n]*/g, "text-zinc-500 italic"],
  [/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/, "text-emerald-300"],
  [/wss?:\/\/[\w.~:/?&=%+-]+/, "text-sky-300 underline decoration-sky-300/30 underline-offset-4"],
  [
    /\b(?:const|let|var|function|return|new|import|from|export|require|def|class|while|if|elif|else|try|except|await|async|print|continue|pass|True|False|None|func|extends|signal|self|void|int|String|float|is|and|not|null)\b/,
    "text-violet-300",
  ],
  [/\b(?:true|false)\b/, "text-amber-300"],
  [/\b\d+(?:\.\d+)?\b/, "text-cyan-300"],
];

const COMBINED = new RegExp(
  RULES.map(([r]) => `(${r.source})`).join("|"),
  "gm",
);

type Part = { text: string; cls?: string };

function tokenize(code: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  COMBINED.lastIndex = 0;
  while ((m = COMBINED.exec(code)) !== null) {
    if (m.index > last) parts.push({ text: code.slice(last, m.index) });
    const groupIdx = m.findIndex((g, i) => i > 0 && g !== undefined) - 1;
    parts.push({ text: m[0], cls: RULES[groupIdx]?.[1] });
    last = m.index + m[0].length;
    if (m[0] === "") COMBINED.lastIndex++; // safety
  }
  if (last < code.length) parts.push({ text: code.slice(last) });
  return parts;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function CodeBlock({
  code,
  title,
  lang = "txt",
  className = "",
}: {
  code: string;
  title?: string;
  lang?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const parts = useMemo(() => tokenize(code), [code]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-[#0a0a12] ${className}`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.02] px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
          <span className="size-1.5 rounded-full bg-emerald-400/80" />
          {title ?? lang}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
          aria-label="Copy code"
        >
          {copied ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Copy size={13} />
          )}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="chat-scroll overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-zinc-300">
        <code>
          {parts.map((p, i) =>
            p.cls ? (
              <span key={i} className={p.cls}>
                {p.text}
              </span>
            ) : (
              <span key={i}>{p.text}</span>
            ),
          )}
        </code>
      </pre>
    </div>
  );
}
