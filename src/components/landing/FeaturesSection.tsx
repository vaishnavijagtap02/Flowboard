"use client";

import { motion } from "framer-motion";
import { BoxSelect, Cpu, ShieldCheck, FileCode, CheckCircle2 } from "lucide-react";

const features = [
  {
    title: "Visual Architecture Design",
    description:
      "Design distributed topologies using semantic primitives — services, databases, queues, gateways, and clients. Rich properties capture tech stacks, responsibilities, and protocols.",
    icon: <BoxSelect size={20} className="text-primary" />,
    badge: "Core Canvas",
  },
  {
    title: "AI-Assisted Improvements",
    description:
      "Flowboard reasons about the semantic graph, not pixels. Prompt the copilot to inject caching layers, partition state, resolve synchronous bottlenecks, and verify fault tolerance.",
    icon: <Cpu size={20} className="text-ai" />,
    badge: "AI Reasoning",
  },
  {
    title: "User-Controlled Changes",
    description:
      "The AI never silently alters your diagrams. Every modification is rendered as an interactive diff proposal. Inspect added nodes and altered connections before approving.",
    icon: <ShieldCheck size={20} className="text-primary" />,
    badge: "Propose · Review · Apply",
  },
  {
    title: "Implementation Artifacts",
    description:
      "Turn your visual system architecture directly into runnable code. Generate docker-compose configurations, TypeScript contracts, and architectural markdown documentation.",
    icon: <FileCode size={20} className="text-ai" />,
    badge: "Compiler",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-card/30 border-y border-border scroll-mt-16 transition-colors">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-16">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary border border-border">
            ENGINEERING WORKFLOW
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4 tracking-tight">
            Built for serious system architecture
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Flowboard separates visual canvas layout from semantic architecture data, allowing developers and AI to collaborate deterministically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-ai/40 transition-all shadow-sm group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-border flex items-center justify-center group-hover:scale-105 transition-transform">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase bg-secondary/60 px-2 py-0.5 rounded border border-border">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
