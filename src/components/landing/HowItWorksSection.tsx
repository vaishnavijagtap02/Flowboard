"use client";

import { motion } from "framer-motion";
import { MessageSquareCode, Workflow, ArrowRightLeft } from "lucide-react";

const steps = [
  {
    icon: <MessageSquareCode size={24} />,
    title: "1. Describe",
    description: "Type what you want to build in plain English. No rigid syntax required.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Workflow size={24} />,
    title: "2. Visualize",
    description: "Flowboard reasons about the optimal architecture and renders it as an interactive graph.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: <ArrowRightLeft size={24} />,
    title: "3. Iterate",
    description: "Click nodes to modify properties, or ask the AI to refactor and expand the system.",
    color: "from-fuchsia-500 to-pink-500"
  }
];

export function HowItWorksSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0A0A0B]">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            How it works
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Stop drawing static boxes. Start generating living architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -z-10" />

          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center p-6"
            >
              <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg shadow-indigo-500/10`}>
                <div className="text-white">
                  {step.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
