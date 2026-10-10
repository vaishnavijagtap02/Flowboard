"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Layers, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center relative overflow-hidden transition-colors selection:bg-ai/25">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-ai/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-md">
        <span className="rounded-full bg-ai/15 px-3 py-1 text-xs font-mono font-bold text-ai border border-ai/30">
          404 · TOPOLOGY NOT FOUND
        </span>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mt-4 mb-3">
          Lost in the architecture.
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8">
          The node or route you're attempting to reach does not exist in the active system topology.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Home size={14} />
            <span>Return Home</span>
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
          >
            <Sparkles size={13} className="text-ai" />
            <span>Explore Demo Sandbox</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
