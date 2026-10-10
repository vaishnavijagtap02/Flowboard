"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  useNodesState,
  useEdgesState,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, CheckCircle2 } from "lucide-react";

// Sleek node cards for the interactive visual preview
const HeroNode = ({ data, selected }: any) => {
  return (
    <div
      className={`relative px-3.5 py-2.5 rounded-xl border bg-card/95 backdrop-blur-md shadow-lg transition-all duration-300 min-w-[130px] ${
        selected ? "border-ai shadow-ai/20 ring-1 ring-ai/40" : "border-border"
      }`}
    >
      <Handle type="target" position={Position.Left} id="target" className="!w-1.5 !h-1.5 !bg-primary/50 !border-none" />
      <Handle type="source" position={Position.Right} id="source" className="!w-1.5 !h-1.5 !bg-primary/50 !border-none" />
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center border text-xs shrink-0"
          style={{
            backgroundColor: `${data.color || "#0284C7"}15`,
            borderColor: `${data.color || "#0284C7"}35`,
            color: data.color || "#0284C7",
          }}
        >
          {data.icon}
        </div>
        <div className="overflow-hidden">
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
            {data.type}
          </p>
          <p className="text-xs font-bold text-foreground truncate">{data.label}</p>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = { hero: HeroNode };

const initialNodes: Node[] = [
  {
    id: "client",
    type: "hero",
    position: { x: 30, y: 120 },
    data: { label: "Next.js Web Client", type: "Client", icon: "🌐", color: "#38BDF8" },
  },
  {
    id: "gateway",
    type: "hero",
    position: { x: 230, y: 120 },
    data: { label: "Kong API Gateway", type: "Gateway", icon: "⚡", color: "#0D9488" },
  },
  {
    id: "service",
    type: "hero",
    position: { x: 440, y: 60 },
    data: { label: "Order & Catalog Service", type: "Service", icon: "⚙️", color: "#0284C7" },
  },
  {
    id: "db",
    type: "hero",
    position: { x: 670, y: 30 },
    data: { label: "Postgres Primary", type: "Database", icon: "🗄️", color: "#2563EB" },
  },
  {
    id: "cache",
    type: "hero",
    position: { x: 670, y: 130 },
    data: { label: "Redis Cluster", type: "Cache Store", icon: "⚡", color: "#D97706" },
  },
  {
    id: "queue",
    type: "hero",
    position: { x: 440, y: 220 },
    data: { label: "Kafka Event Broker", type: "Message Queue", icon: "📨", color: "#6366F1" },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e-client-gw",
    source: "client",
    sourceHandle: "source",
    target: "gateway",
    targetHandle: "target",
    animated: true,
    style: { stroke: "#0284C7", strokeWidth: 2 },
  },
  {
    id: "e-gw-service",
    source: "gateway",
    sourceHandle: "source",
    target: "service",
    targetHandle: "target",
    animated: true,
    style: { stroke: "#0284C7", strokeWidth: 2 },
  },
  {
    id: "e-service-db",
    source: "service",
    sourceHandle: "source",
    target: "db",
    targetHandle: "target",
    animated: true,
    style: { stroke: "#2563EB", strokeWidth: 2 },
  },
  {
    id: "e-service-cache",
    source: "service",
    sourceHandle: "source",
    target: "cache",
    targetHandle: "target",
    animated: true,
    style: { stroke: "#38BDF8", strokeWidth: 2, strokeDasharray: "4 4" },
  },
  {
    id: "e-service-queue",
    source: "service",
    sourceHandle: "source",
    target: "queue",
    targetHandle: "target",
    animated: true,
    style: { stroke: "#6366F1", strokeWidth: 2 },
  },
];

export function InteractiveHeroVisual() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedMessage, setSimulatedMessage] = useState<string | null>(null);

  const handleSimulateMutation = useCallback(() => {
    if (isSimulating) return;
    setIsSimulating(true);

    setTimeout(() => {
      // Inject payment service
      const paymentNodeId = "service-payment";
      const exists = nodes.some((n) => n.id === paymentNodeId);

      if (!exists) {
        const paymentNode: Node = {
          id: paymentNodeId,
          type: "hero",
          position: { x: 670, y: 220 },
          data: {
            label: "Stripe Payment Worker",
            type: "Service",
            icon: "💳",
            color: "#0284C7",
          },
        };

        const paymentEdge: Edge = {
          id: "e-queue-payment",
          source: "queue",
          sourceHandle: "source",
          target: paymentNodeId,
          targetHandle: "target",
          animated: true,
          style: { stroke: "#6366F1", strokeWidth: 2 },
        };

        setNodes((prev) => [...prev, paymentNode]);
        setEdges((prev) => [...prev, paymentEdge]);
        setSimulatedMessage("AI Proposed & Applied: Stripe Payment Worker via Kafka");
      } else {
        setSimulatedMessage("Topology optimized: all connections verified.");
      }

      setIsSimulating(false);
      setTimeout(() => setSimulatedMessage(null), 4000);
    }, 800);
  }, [isSimulating, nodes, setNodes, setEdges]);

  return (
    <div className="relative w-full aspect-[21/10] bg-card rounded-2xl border border-border overflow-hidden shadow-2xl flex flex-col transition-colors">
      {/* Visual Window Header */}
      <div className="h-10 border-b border-border flex items-center justify-between px-4 bg-secondary/30">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            system_architecture.flow
          </span>
          <span className="rounded bg-ai/15 px-1.5 py-0.2 text-[9px] font-semibold text-ai border border-ai/25">
            LIVE PREVIEW
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground hidden sm:block">
          Interactive Canvas
        </div>
      </div>

      {/* Main visualization canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          zoomOnScroll={false}
          panOnDrag={true}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--canvas-dots)" />
        </ReactFlow>

        {/* AI Command Bar floating at bottom of canvas */}
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-10">
          <div className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card/90 shadow-xl backdrop-blur-xl">
            <Sparkles size={14} className="text-ai ml-2 shrink-0" />
            <span className="text-xs text-muted-foreground hidden md:inline truncate max-w-xs">
              AI Copilot: "Propose event-driven payment worker"
            </span>
            <button
              onClick={handleSimulateMutation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 active:scale-95 text-xs font-semibold text-primary-foreground shadow-sm transition-all disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border border-primary-foreground border-t-transparent" />
                  <span>Proposing...</span>
                </>
              ) : (
                <>
                  <span>Simulate AI Proposal</span>
                  <Play size={10} fill="currentColor" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mutation notice */}
        <AnimatePresence>
          {simulatedMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full border border-ai/30 bg-card/95 backdrop-blur-md text-xs font-medium text-foreground flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 size={13} className="text-ai shrink-0" />
              <span>{simulatedMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
