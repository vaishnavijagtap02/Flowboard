// CanvasArea — Main React Flow canvas wrapper.
// Handles drag-to-add from toolbar, node/edge events, and viewport tracking.

"use client";

import { useCallback, useRef, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type ReactFlowInstance,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nanoid } from "nanoid";

import { nodeTypes } from "@/components/canvas/nodes";
import { edgeTypes } from "@/components/edges/SemanticEdge";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import type { FlowNode } from "@/types/canvas";
import type { NodeType } from "@/types/semantic";
import { AUTO_SAVE_DEBOUNCE_MS } from "@/lib/constants";

export function CanvasArea() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  // Canvas store
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNode = useCanvasStore((s) => s.addNode);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const saveToLocalStorage = useCanvasStore((s) => s.saveToLocalStorage);
  const loadFromLocalStorage = useCanvasStore((s) => s.loadFromLocalStorage);

  // UI store
  const selectNode = useUIStore((s) => s.selectNode);
  const selectEdge = useUIStore((s) => s.selectEdge);
  const clearSelection = useUIStore((s) => s.clearSelection);

  // Load saved state on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  // Auto-save with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveToLocalStorage();
    }, AUTO_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [nodes, edges, saveToLocalStorage]);

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

      // Convert screen coordinates to flow coordinates
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
          name: `New ${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}`,
          technology: "",
          description: "",
          responsibilities: [],
        },
      };

      addNode(newNode);
      selectNode(id);
    },
    [addNode, selectNode]
  );

  // Handle init
  const onInit = useCallback((instance: ReactFlowInstance) => {
    reactFlowInstance.current = instance;
  }, []);

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle edge click
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  // Track viewport changes
  const onMoveEnd = useCallback(
    (_: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  return (
    <div ref={reactFlowWrapper} className="h-full w-full">
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
        snapGrid={[16, 16]}
        connectionLineStyle={{ stroke: "#6B7280", strokeWidth: 1.5 }}
        deleteKeyCode={["Backspace", "Delete"]}
        className="bg-gray-50"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#d1d5db"
        />
        <Controls
          position="bottom-left"
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
        />
        <MiniMap
          position="bottom-right"
          className="!bg-white !border !border-gray-200 !rounded-lg !shadow-md"
          maskColor="rgb(243, 244, 246, 0.7)"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
