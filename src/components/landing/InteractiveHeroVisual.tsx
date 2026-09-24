"use client";

import { useState, useCallback, useEffect } from "react";
import { ReactFlow, Background, BackgroundVariant, type Edge, type Node, useNodesState, useEdgesState } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles } from "lucide-react";

// Minimal mock node types for the landing page visual
const HeroNode = ({ data, selected }: any) => {
  return (
    <div className={`px-4 py-3 rounded-lg border bg-[#111113]/90 backdrop-blur-md shadow-xl transition-all duration-500
      ${data.generated ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
      ${selected ? 'border-indigo-500 shadow-indigo-500/20' : 'border-white/10'}
    `}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center bg-white/5 border border-white/5 text-${data.color}-400`}>
          {data.icon}
        </div>
        <div>
          <p className="text-xs text-white/50 font-medium uppercase tracking-wider mb-0.5">{data.type}</p>
          <p className="text-sm font-semibold text-white/90">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { hero: HeroNode };

const initialNodes: Node[] = [
  { id: "client", type: "hero", position: { x: 50, y: 150 }, data: { label: "Web Client", type: "React", color: "cyan", icon: "🌐" } },
  { id: "api", type: "hero", position: { x: 300, y: 150 }, data: { label: "API Gateway", type: "Node.js", color: "indigo", icon: "⚡" } },
  { id: "db", type: "hero", position: { x: 550, y: 50 }, data: { label: "Primary Database", type: "PostgreSQL", color: "emerald", icon: "🗄️" } },
  { id: "cache", type: "hero", position: { x: 550, y: 250 }, data: { label: "Session Cache", type: "Redis", color: "red", icon: "⚡" } },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "client", target: "api", animated: true, style: { stroke: "#6366f1", strokeWidth: 2, strokeDasharray: "5 5" } },
  { id: "e2", source: "api", target: "db", animated: true, style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "5 5" } },
  { id: "e3", source: "api", target: "cache", animated: true, style: { stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "5 5" } },
];

export function InteractiveHeroVisual() {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map(n => ({ ...n, data: { ...n.data, generated: false } }))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleGenerate = useCallback(() => {
    if (isGenerating || hasGenerated) return;
    setIsGenerating(true);
    setInputValue("Generating architecture...");

    // Simulate generation sequence
    let currentStep = 0;
    
    const interval = setInterval(() => {
      setNodes(nds => nds.map((n, i) => {
        if (i === currentStep) return { ...n, data: { ...n.data, generated: true } };
        return n;
      }));
      
      if (currentStep > 0) {
        setEdges(eds => [...eds, initialEdges[currentStep - 1]]);
      }

      currentStep++;
      
      if (currentStep > initialNodes.length) {
        clearInterval(interval);
        setIsGenerating(false);
        setHasGenerated(true);
        setInputValue("Architecture generated successfully.");
      }
    }, 600);
  }, [isGenerating, hasGenerated, setNodes, setEdges]);

  return (
    <div className="relative w-full aspect-[21/9] bg-[#0C0C0E] rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-indigo-500/10 flex flex-col">
      {/* Fake window header */}
      <div className="h-10 border-b border-white/5 flex items-center px-4 bg-[#111113]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
           <span className="text-xs font-mono text-white/40">workspace.flowboard.ai</span>
        </div>
      </div>

      {/* Main visualization area */}
      <div className="flex-1 relative">
        {!hasGenerated && !isGenerating && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-500">
            {/* AI Command Bar Prompt */}
            <div className="w-full max-w-lg p-2 rounded-xl bg-[#1A1A1E]/80 border border-white/10 shadow-2xl backdrop-blur-xl flex items-center gap-2 relative z-20">
              <Sparkles size={18} className="text-indigo-400 ml-3 shrink-0" />
              <input 
                type="text"
                placeholder="e.g. A web app with Node.js, Postgres, and Redis..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-white/90 placeholder:text-white/30 h-10 px-2"
                readOnly
              />
              <button 
                onClick={handleGenerate}
                className="h-10 px-4 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                Generate <Play size={14} fill="currentColor" />
              </button>
            </div>
          </div>
        )}

        {/* The React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          zoomOnScroll={false}
          panOnDrag={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
          className="bg-[#0C0C0E]"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff10" />
        </ReactFlow>

        {/* Generating overlay status */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white/70 flex items-center gap-3"
            >
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Reasoning about architecture...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
