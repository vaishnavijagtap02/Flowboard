"use client";

import { motion } from "framer-motion";
import { Layers, MessageSquare, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: <Layers size={22} className="text-primary" />,
    title: "1. Design",
    description:
      "Map out microservices, databases, caches, and gateways on an infinite, interactive canvas. Define protocols and tech stacks with zero boilerplate.",
    badge: "Visual Canvas",
  },
  {
    step: "02",
    icon: <MessageSquare size={22} className="text-ai" />,
    title: "2. Ask AI",
    description:
      "Chat with the architecture copilot. Ask to resolve latency bottlenecks, inject read-replica caches, decouple synchronous flows, or audit security.",
    badge: "LLM Reasoning",
  },
  {
    step: "03",
    icon: <CheckCircle size={22} className="text-primary" />,
    title: "3. Review & Apply",
    description:
      "Inspect the generated mutation diff. Verify topological changes and approve them to update the canvas instantly with complete referential integrity.",
    badge: "User in Control",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden bg-background scroll-mt-16 transition-colors">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary border border-border">
            WORKFLOW
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4 tracking-tight">
            Design → Ask AI → Review & Apply
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Stop drawing static whiteboard boxes. Build living system architectures with AI assistance you control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[1px] bg-border -z-10" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-ai/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center border border-border bg-secondary/50 shadow-sm">
                {s.icon}
              </div>
              <span className="text-[10px] font-mono font-bold text-ai uppercase tracking-wider mb-1">
                Step {s.step}
              </span>
              <h3 className="text-lg font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4">
                {s.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2.5 py-0.5 text-[10px] font-semibold text-foreground/80 border border-border">
                {s.badge}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
