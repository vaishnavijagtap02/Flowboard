"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InteractiveHeroVisual } from "./InteractiveHeroVisual"; // Reusing the same visual for the showcase for now, but scaled down

export function ShowcaseSection() {
  return (
    <section className="py-24 bg-[#0A0A0B] overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Instant feedback loop. <br />
              <span className="text-gray-500">Zero context switching.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              When you edit a node's properties, the semantic graph updates instantly. When the AI mutates the graph, the canvas re-renders beautifully.
            </p>
            <ul className="space-y-4 pt-4">
              {['Auto-layout with Dagre', 'Strict Zod validation', 'Zustand state management'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="pt-8">
              <Link
                href="/board"
                className="inline-flex items-center gap-2 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
              >
                Try the interactive canvas <ArrowRight size={16} />
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 blur-[80px] -z-10 rounded-full" />
            <InteractiveHeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
