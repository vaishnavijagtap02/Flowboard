"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Layers } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-card/40 pt-20 pb-12 transition-colors">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary border border-border">
          READY TO ARCHITECT?
        </span>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-4 tracking-tight">
          Your next distributed system starts here.
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Experience AI-assisted system architecture design with complete user control and zero silent mutations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16">
          <Link
            href="/board"
            className="w-full sm:w-auto inline-flex h-12 px-8 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-98"
          >
            <span>Start Building Canvas</span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex h-12 px-7 items-center justify-center gap-2 rounded-xl border border-border bg-card/60 text-foreground text-sm font-medium hover:bg-secondary transition-colors"
          >
            <Sparkles size={14} className="text-ai" />
            <span>Explore Demo Sandbox</span>
          </Link>
        </div>

        {/* Footer Navigation */}
        <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground text-[10px] font-bold">F</span>
            </div>
            <span className="font-semibold text-foreground">Flowboard</span>
            <span>·</span>
            <span>AI Architecture Design & Collaboration</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/board" className="hover:text-foreground transition-colors">
              Studio
            </Link>
            <Link href="/demo" className="hover:text-foreground transition-colors">
              Sandbox
            </Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>

          <p>© {new Date().getFullYear()} Flowboard. Midnight Navy & Ice Blue Edition.</p>
        </div>
      </div>
    </footer>
  );
}
