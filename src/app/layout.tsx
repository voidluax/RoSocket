import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ws-chat-server — WebSocket API Reference",
  description:
    "Single-room WebSocket broadcast server built with Node.js + ws. Server-controlled developer flags, four fields in, booleans out. Deployable on Render in one click.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#05050a] font-sans text-zinc-300 antialiased">
        {children}
      </body>
    </html>
  );
}
