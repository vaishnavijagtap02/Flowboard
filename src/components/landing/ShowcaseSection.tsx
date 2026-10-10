"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Check, CheckCircle2, ShieldCheck, Plus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ShowcaseSection() {
  const [applied, setApplied] = useState(false);

  return (
    <section id="showcase" className="py-24 bg-card/30 border-t border-border overflow-hidden scroll-mt-16 transition-colors">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Text */}
          <div className="flex-1 space-y-6">
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary border border-border">
              MUTATION REVIEW WORKFLOW
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Zero silent mutations. <br />
              <span className="text-ai">You remain in control.</span>
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Generic AI tools silently tamper with your workspace. Flowboard operates on a strict
              <span className="text-foreground font-semibold"> propose, review, and apply</span> contract.
              Every node insertion and connection change is validated for referential integrity before you accept.
            </p>

            <ul className="space-y-3.5 pt-2">
              {[
                "Strict topological validation with Zod schemas",
                "Visual diff cards highlight additions and modifications",
                "Deterministic graph serialization (never hallucinated edges)",
                "One-click rollback and versioned history snapshots",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground/90 font-medium">
                  <div className="w-5 h-5 rounded-full bg-ai/15 flex items-center justify-center text-ai shrink-0">
                    <Check size={11} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 flex items-center gap-4">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
              >
                <span>Test Workflow in Sandbox</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* Right Visual: Interactive Mutation Diff Card */}
          <div className="flex-1 w-full max-w-lg">
            <div className="rounded-2xl border border-ai/40 bg-card p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai/20 text-ai">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">AI Mutation Proposal</h4>
                    <p className="text-[10px] text-muted-foreground">Proposal #MP-8201 · Redis Cache Ingestion</p>
                  </div>
                </div>
                <span className="rounded bg-ai/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-ai border border-ai/30">
                  PENDING REVIEW
                </span>
              </div>

              {/* Rationale */}
              <div className="py-4 text-xs text-muted-foreground leading-relaxed">
                "High read frequency detected on PostgreSQL order queries. Proposing a dedicated Redis cache to offload 85% of read volume."
              </div>

              {/* Diff list */}
              <div className="space-y-2 mb-5">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500 font-mono">
                      + ADD NODE
                    </span>
                    <span className="font-semibold text-foreground">cache-redis</span>
                    <span className="text-[10px] text-muted-foreground">(Redis 7.2 Cache)</span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-mono">NEW</span>
                </div>

                <div className="rounded-xl border border-ai/30 bg-ai/10 p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-ai/20 px-1.5 py-0.5 text-[9px] font-bold text-ai font-mono">
                      + ADD EDGE
                    </span>
                    <span className="font-semibold text-foreground">service-order ➔ cache-redis</span>
                  </div>
                  <span className="text-[10px] text-ai font-mono">reads_from</span>
                </div>
              </div>

              {/* Integrity status */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-5 px-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Referential integrity validated · 0 dangling edges</span>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setApplied(true)}
                  disabled={applied}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                    applied
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-primary-foreground hover:opacity-90 active:scale-98"
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Applied to Canvas</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Changes</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
                {applied && (
                  <button
                    onClick={() => setApplied(false)}
                    className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-xs hover:bg-secondary"
                    title="Reset proposal"
                  >
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
