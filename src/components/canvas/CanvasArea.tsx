// CanvasArea — Main React Flow canvas wrapper.
// Handles drag-to-add, node/edge events, viewport tracking, keyboard shortcuts,
// dark obsidian grid background, and empty state blueprint prompt.

"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";
import { Sparkles, Layers } from "lucide-react";

import { nodeTypes } from "@/components/canvas/nodes";
import { edgeTypes } from "@/components/edges/SemanticEdge";
import { FloatingNodePalette } from "@/components/canvas/FloatingNodePalette";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { NodeType } from "@/types/semantic";
import { NODE_TYPE_CONFIG } from "@/lib/constants";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/lib/constants";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";

export function CanvasArea() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);

  // Canvas store
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const saveToLocalStorage = useCanvasStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useCanvasStore((s) => s.loadFromLocalStorage);

  // UI store
  const selectNode = useUIStore((s) => s.selectNode);
  const selectEdge = useUIStore((s) => s.selectEdge);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  // Load saved state on mount (or load template if completely empty)
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    if (!loaded && nodes.length === 0) {
      // Load initial e-commerce blueprint so user immediately sees a wow experience
      loadTemplate("ecommerce");
    }
  }, [loadFromLocalStorage, loadTemplate, nodes.length]);

  // Auto-save with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveToLocalStorage();
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [nodes, edges, saveToLocalStorage]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Cmd+J or Ctrl+J to toggle AI Chat
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleChat();
        return;
      }

      // Quick single-key node spawning
      const keyMap: Record<string, NodeType> = {
        s: "service",
        d: "database",
        a: "api",
        q: "queue",
        c: "cache",
        g: "gateway",
        w: "client",
      };

      const matchedType = keyMap[e.key.toLowerCase()];
      if (matchedType && reactFlowInstance.current && !e.metaKey && !e.ctrlKey) {
        const config = NODE_TYPE_CONFIG[matchedType];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const position = reactFlowInstance.current.screenToFlowPosition({
          x: centerX + (Math.random() * 80 - 40),
          y: centerY + (Math.random() * 80 - 40),
        });

        const id = `${matchedType}-${nanoid(6)}`;
        const newNode: FlowNode = {
          id,
          type: matchedType,
          position,
          data: {
            id,
            type: matchedType,
            name: `New ${config.label}`,
            technology: config.defaultTech[0] || "",
            description: config.description,
            responsibilities: [],
          },
        };

        addNode(newNode);
        selectNode(id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleChat, addNode, selectNode]);

  // Handle drag-over for toolbar drops
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop from toolbar — creates a new node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/flowboard-node-type"
      ) as NodeType;

      if (!nodeType || !reactFlowInstance.current) return;

      const config = NODE_TYPE_CONFIG[nodeType] || NODE_TYPE_CONFIG.service;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const id = `${nodeType}-${nanoid(6)}`;

      const newNode: FlowNode = {
        id,
        type: nodeType,
        position,
        data: {
          id,
          type: nodeType,
          name: `New ${config.label}`,
          technology: config.defaultTech[0] || "",
          description: config.description,
          responsibilities: [],
        },
      };

      addNode(newNode);
      selectNode(id);
    },
    [addNode, selectNode]
  );

  const onInit = useCallback((instance: ReactFlowInstance<FlowNode, FlowEdge>) => {
    reactFlowInstance.current = instance;
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const theme = useUIStore((s) => s.theme);

  return (
    <div ref={reactFlowWrapper} className="relative h-full w-full bg-background overflow-hidden transition-colors duration-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: "semantic",
          animated: false,
        }}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        connectionLineStyle={{ stroke: "#0284C7", strokeWidth: 2 }}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color={
            theme === "dark"
              ? "rgba(143, 166, 191, 0.16)"
              : "rgba(15, 29, 51, 0.12)"
          }
        />

        <Controls
          position="bottom-left"
          className="!m-4 !border-border !bg-card !text-foreground"
        />

        <MiniMap
          position="bottom-right"
          className="!m-4 !border-border !bg-card"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Floating Node Palette Dock */}
      <FloatingNodePalette />

      {/* Empty State Banner (Shown when 0 nodes) */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-4">
          <div className="pointer-events-auto max-w-xl w-full rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={20} />
            </div>
            <h2 className="text-base font-bold text-foreground mb-1">
              Start Designing Your System
            </h2>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed max-w-md mx-auto">
              Select an architectural blueprint to explore, drag components from the bottom palette, or prompt Flowboard AI to generate a custom topology.
            </p>

            <div className="mb-4 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mb-2 px-1">
                Architectural Blueprints:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ARCHITECTURE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => loadTemplate(tmpl.id)}
                    className="flex flex-col text-left rounded-xl border border-border/80 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/50 p-3 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        {tmpl.badge}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {tmpl.nodeCount} nodes
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {tmpl.name}
                    </span>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                      {tmpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/60">
              <button
                onClick={() => {
                  setChatOpen(true);
                  sendMessage("Design a resilient cloud architecture with API Gateway, microservices, database, cache, and message queue.");
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-95 transition-all shadow-md hover:shadow-primary/20"
              >
                <Sparkles size={14} />
                Prompt AI to Design Custom System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
