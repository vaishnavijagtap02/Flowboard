// VisionUploadModal — Multimodal Screenshot & Whiteboard Architecture Scanner.
// Allows developers to drag-drop, browse, or direct-paste (Ctrl+V) architecture diagrams,
// meeting whiteboard sketches, or system design screenshots and convert them into
// an interactive Flowboard canvas with automated Dagre layout.

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  UploadCloud,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useChatStore } from "@/stores/chatStore";
import type { AIMutationPlan } from "@/types/mutations";

export function VisionUploadModal() {
  const isOpen = useUIStore((s) => s.isVisionModalOpen);
  const closeVisionModal = useUIStore((s) => s.closeVisionModal);
  const applyMutations = useCanvasStore((s) => s.applyMutations);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const addChatMessage = useChatStore((s) => s.addMessage);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hint, setHint] = useState<string>("");
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [extractedPlan, setExtractedPlan] = useState<AIMutationPlan | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelected = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds 10MB limit. Please upload a smaller screenshot.");
      return;
    }

    setError(null);
    setExtractedPlan(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Direct clipboard paste handler (Cmd+V / Ctrl+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageSelected(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelected(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedPlan(null);
    setError(null);
    setIsScanning(false);
  };

  const handleScanArchitecture = async () => {
    if (!imagePreview) return;

    setIsScanning(true);
    setError(null);
    setScanStep("Uploading screenshot to Vision Engine...");

    try {
      setTimeout(() => setScanStep("Detecting boxes, nodes & technology stacks..."), 1200);
      setTimeout(() => setScanStep("Mapping data flows, protocols & edge directions..."), 2400);

      const res = await fetch("/api/ai/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imagePreview,
          mimeType: imageFile?.type || "image/png",
          hint: hint.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Vision analysis failed");
      }

      setExtractedPlan(data.plan);
      setScanStep("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze architecture screenshot.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyToCanvas = () => {
    if (!extractedPlan) return;

    if (importMode === "replace") {
      clearCanvas();
    }

    // Apply extracted mutations
    applyMutations(extractedPlan);

    // Run clean Dagre hierarchical auto-layout
    setTimeout(() => {
      autoLayout("LR");
    }, 100);

    // Also record plan in AI Chat history for future reference
    addChatMessage({
      id: `vision-plan-${Date.now()}`,
      role: "assistant",
      type: "mutation_plan",
      content: extractedPlan.explanation,
      timestamp: Date.now(),
      mutationPlan: extractedPlan,
      status: "approved",
    });

    closeVisionModal();
    handleReset();
  };

  if (!isOpen) return null;

  const nodeCount = extractedPlan?.mutations.filter((m) => m.action === "ADD_NODE").length || 0;
  const edgeCount = extractedPlan?.mutations.filter((m) => m.action === "ADD_EDGE").length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden transition-all duration-300">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-ai to-transparent opacity-80" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai/15 text-ai border border-ai/30 shadow-sm shadow-ai/20">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                Scan Architecture from Screenshot
                <span className="rounded-full bg-ai/15 px-2 py-0.5 text-[10px] font-mono font-bold text-ai border border-ai/30">
                  GPT-4o Vision
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Drop or paste a meeting screenshot, diagram, or whiteboard sketch to auto-build your canvas
              </p>
            </div>
          </div>
          <button
            onClick={closeVisionModal}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {!imagePreview ? (
            /* Upload & Drag Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer group ${
                isDragging
                  ? "border-ai bg-ai/10 shadow-lg shadow-ai/10"
                  : "border-border hover:border-ai/50 bg-secondary/20 hover:bg-secondary/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleImageSelected(e.target.files[0]);
                }}
              />

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-ai border border-border group-hover:scale-105 group-hover:border-ai/40 transition-transform mb-3 shadow-inner">
                <UploadCloud size={26} />
              </div>

              <h3 className="text-sm font-bold text-foreground mb-1 text-center">
                Click to upload, drag & drop, or paste screenshot
              </h3>
              <p className="text-xs text-muted-foreground text-center max-w-sm mb-3">
                Supports PNG, JPG, or WebP. Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Ctrl+V</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Cmd+V</kbd> directly from your snipping tool.
              </p>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Meeting Whiteboards
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Miro / Draw.io Snaps
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" /> Cloud Topologies
                </span>
              </div>
            </div>
          ) : (
            /* Image Preview & Scanner Controls */
            <div className="space-y-4">
              <div className="relative rounded-2xl border border-border overflow-hidden bg-black/40 group max-h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Architecture screenshot preview"
                  className="max-h-64 w-full object-contain"
                />

                {/* Scanning laser line animation */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-ai to-transparent shadow-[0_0_15px_#38bdf8] animate-pulse absolute top-1/2 -translate-y-1/2" />
                    <div className="absolute inset-0 bg-ai/10 backdrop-blur-[1px]" />
                  </div>
                )}

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    disabled={isScanning}
                    className="px-2.5 py-1 rounded-lg bg-card/80 backdrop-blur-md border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    Change Screenshot
                  </button>
                </div>
              </div>

              {/* Context Hint Input */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Meeting Notes / Architectural Context (Optional)
                </label>
                <input
                  type="text"
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  disabled={isScanning || Boolean(extractedPlan)}
                  placeholder="e.g., Microservices checkout redesign discussed in architecture sync"
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ai transition-colors"
                />
              </div>

              {/* Import Mode Selector */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/20 text-xs">
                <div>
                  <p className="font-semibold text-foreground">Canvas Placement</p>
                  <p className="text-[11px] text-muted-foreground">
                    {importMode === "replace"
                      ? "Replace canvas and build a fresh topology from this screenshot"
                      : "Append new extracted components to existing board"}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setImportMode("replace")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      importMode === "replace"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Replace Canvas
                  </button>
                  <button
                    onClick={() => setImportMode("append")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      importMode === "append"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Append Nodes
                  </button>
                </div>
              </div>

              {/* Extracted Architecture Result Banner */}
              {extractedPlan && (
                <div className="rounded-2xl border border-ai/30 bg-ai/10 p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-ai font-semibold text-xs">
                      <Sparkles size={16} />
                      <span>Architecture Successfully Extracted</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-ai/20 text-ai border border-ai/30 font-bold">
                        {nodeCount} Components
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-ai/20 text-ai border border-ai/30 font-bold">
                        {edgeCount} Connections
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
                    {extractedPlan.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/30">
          <button
            onClick={closeVisionModal}
            className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>

          {!extractedPlan ? (
            <button
              onClick={handleScanArchitecture}
              disabled={!imagePreview || isScanning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isScanning ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-ai" />
                  <span>{scanStep || "Analyzing topology..."}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-ai" />
                  <span>Extract Architecture Topology</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleApplyToCanvas}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ai text-white text-xs font-bold shadow-md shadow-ai/30 hover:opacity-90 active:scale-95 transition-all"
            >
              <CheckCircle2 size={14} />
              <span>Apply to Canvas & Auto-Layout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
