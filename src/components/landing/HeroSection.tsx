"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Terminal, Play } from "lucide-react";
import Link from "next/link";
import { InteractiveHeroVisual } from "./InteractiveHeroVisual";

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 w-full h-full bg-background -z-20 transition-colors" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-ai/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[100px] rounded-full -z-10 pointer-events-none" />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] -z-10 opacity-70" 
      />

      <div className="container px-4 md:px-6 flex flex-col items-center text-center max-w-5xl mx-auto z-10">
        {/* Subtle pill badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-secondary/50 backdrop-blur-sm text-xs font-medium text-foreground mb-8"
        >
          <Sparkles size={14} className="text-ai" />
          <span>AI-Powered Visual System Architecture</span>
        </motion.div>

        {/* Primary Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-[1.08]"
        >
          Design systems. <br />
          <span className="text-ai">Think clearly.</span>
        </motion.h1>

        {/* Clear explanation of AI-assisted architecture design */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed"
        >
          Map microservices, databases, and message brokers visually. Flowboard's AI copilot
          identifies single points of failure, proposes architectural improvements, and lets you
          review every change before applying.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-3.5 mb-16 w-full sm:w-auto"
        >
          <Link
            href="/board"
            className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 shadow-md shadow-primary/20 transition-all active:scale-98"
          >
            <span>Start Building</span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/demo"
            className="w-full sm:w-auto h-12 px-7 flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 text-foreground text-sm font-medium hover:bg-secondary transition-colors backdrop-blur-sm"
          >
            <Sparkles size={14} className="text-ai" />
            <span>Explore Demo</span>
          </Link>
        </motion.div>

        {/* Architecture Canvas Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          className="w-full max-w-4xl"
        >
          <InteractiveHeroVisual />
        </motion.div>
      </div>
    </section>
  );
}
