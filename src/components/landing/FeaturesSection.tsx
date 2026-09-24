"use client";

import { motion } from "framer-motion";
import { Cpu, ShieldCheck, BoxSelect, Server } from "lucide-react";

const features = [
  {
    title: "AI-Powered Generation",
    description: "Powered by an advanced mutation engine, the LLM reasons about semantic graphs, not pixels.",
    icon: <Cpu size={20} className="text-cyan-400" />
  },
  {
    title: "Referential Integrity",
    description: "Every generated connection is validated. No hallucinated edges or dangling node references.",
    icon: <ShieldCheck size={20} className="text-emerald-400" />
  },
  {
    title: "Interactive Canvas",
    description: "Drag, drop, pan, and zoom. Modify the AI's output exactly how you want it.",
    icon: <BoxSelect size={20} className="text-indigo-400" />
  },
  {
    title: "Artifact Export",
    description: "Generate docker-compose files, API contracts, and architecture READMEs directly from the graph.",
    icon: <Server size={20} className="text-fuchsia-400" />
  }
];

export function FeaturesSection() {
  return (
    <section className="py-24 bg-[#070708] border-y border-white/5">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Built for engineering teams
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Flowboard separates visual state from semantic data, allowing AI to reason deterministically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-[#111113] border border-white/5 hover:border-white/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
