"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FooterSection() {
  return (
    <footer className="border-t border-white/5 bg-[#050506] pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Your next system starts as an idea.
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
          Experience the future of system architecture planning with Flowboard's AI-driven visual canvas.
        </p>
        
        <Link
          href="/board"
          className="inline-flex h-12 px-8 items-center justify-center gap-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors shadow-xl shadow-indigo-500/20"
        >
          Start Building Now
          <ArrowRight size={16} />
        </Link>
        
        <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">F</span>
            </div>
            <span className="font-semibold text-gray-300">Flowboard</span>
          </div>
          <p>© {new Date().getFullYear()} Flowboard. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
