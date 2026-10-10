"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  Trash2,
  ExternalLink,
  Clock,
  Shield,
  Sun,
  Moon,
  LogOut,
  FolderKanban,
  Database,
  CloudCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUIStore } from "@/stores/uiStore";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";

interface BoardItem {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
  edgeCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, signOut, isConfigured, loading: authLoading } = useAuth();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const [boards, setBoards] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCloudPersisted, setIsCloudPersisted] = useState(false);

  // New board modal state
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("blank");
  const [isCreating, setIsCreating] = useState(false);

  // Redirect to login if user is not authenticated and Supabase is configured
  useEffect(() => {
    if (!authLoading && isConfigured && !user) {
      router.push("/login");
    }
  }, [user, authLoading, isConfigured, router]);

  // Fetch boards
  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      if (data.success) {
        setBoards(data.boards || []);
        setIsCloudPersisted(Boolean(data.isCloudPersisted));
      } else {
        setError(data.error || "Failed to load boards");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to storage service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // Filter boards
  const filteredBoards = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase();
    return boards.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
    );
  }, [boards, searchQuery]);

  const handleDeleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this architecture board?")) return;

    try {
      const res = await fetch(`/api/boards?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBoards((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setIsCreating(true);
    const boardId = `board-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const template = ARCHITECTURE_TEMPLATES.find((t) => t.id === selectedTemplateId);

    const canvasData = template
      ? { nodes: template.nodes, edges: template.edges, viewport: { x: 0, y: 0, zoom: 1 } }
      : { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };

    try {
      const res = await fetch("/api/boards/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          name: newBoardName.trim(),
          canvasData,
          summary: "Initial board setup",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsNewBoardModalOpen(false);
        router.push(`/board?id=${boardId}`);
      } else {
        alert("Failed to initialize board: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error creating board: " + err?.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors selection:bg-ai/25">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-card/85 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 border border-primary/30 transition-transform group-hover:scale-105">
              <span className="text-sm font-black tracking-tight">F</span>
            </div>
            <span className="text-base font-bold tracking-tight text-foreground">
              Flowboard
            </span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-primary border border-border">
              DASHBOARD
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <Link href="/board" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Layers size={13} />
              <span>Studio Workspace</span>
            </Link>
            <Link href="/demo" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Sparkles size={13} className="text-ai" />
              <span>Interactive Sandbox</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            title="Toggle theme"
          >
            {theme === "light" ? (
              <>
                <Sun size={13} className="text-amber-500" />
                <span className="text-[11px] hidden sm:inline">Porcelain Ice</span>
              </>
            ) : (
              <>
                <Moon size={13} className="text-ai" />
                <span className="text-[11px] hidden sm:inline">Midnight Navy</span>
              </>
            )}
          </button>

          {/* User profile / Sign out */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-[11px] font-semibold text-foreground truncate max-w-[140px]">
                  {user.email}
                </span>
                <span className="text-[9px] text-muted-foreground">Authenticated</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 p-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
                title="Sign out of account"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            >
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-8">
        {/* Welcome & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Architecture Projects
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Visual system architectures, component topologies, and versioned AI mutation logs.
            </p>
          </div>

          <button
            onClick={() => {
              setNewBoardName("");
              setSelectedTemplateId("blank");
              setIsNewBoardModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90 active:scale-98 transition-all shrink-0"
          >
            <Plus size={15} />
            <span>Create New Board</span>
          </button>
        </div>

        {/* Search & Cloud Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search architecture boards by name..."
              className="w-full rounded-xl border border-border bg-card/60 pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/50 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{boards.length} Boards</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card/50 text-[11px]">
              <Database size={11} className={isCloudPersisted ? "text-ai" : "text-amber-500"} />
              <span>{isCloudPersisted ? "Supabase Cloud" : "Local Store"}</span>
            </span>
          </div>
        </div>

        {/* Board Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-2xl border border-border bg-card/40 animate-pulse p-5" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-center text-xs text-destructive">
            <AlertCircle size={24} className="mx-auto mb-2" />
            <p className="font-semibold mb-1">Error Loading Boards</p>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchBoards}
              className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-secondary text-xs"
            >
              Try Again
            </button>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary mx-auto mb-3 text-muted-foreground">
              <FolderKanban size={22} />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1">
              {searchQuery ? "No matching boards" : "No architecture boards yet"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
              {searchQuery
                ? `No boards match "${searchQuery}". Try a different keyword.`
                : "Create your first system diagram or bootstrap from a pre-assembled microservices blueprint."}
            </p>
            <button
              onClick={() => {
                setNewBoardName("My System Architecture");
                setSelectedTemplateId("ecommerce");
                setIsNewBoardModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
              <span>Bootstrap Starter Architecture</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBoards.map((board) => (
              <motion.div
                key={board.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => router.push(`/board?id=${board.id}`)}
                className="group relative rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {board.name}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteBoard(board.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                      title="Delete board"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {board.description || "Interactive system architecture graph with semantic connections and AI mutations."}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {typeof board.nodeCount === "number" && board.nodeCount > 0 ? (
                      <span className="rounded bg-secondary/80 px-1.5 py-0.5 font-medium text-foreground text-[10px]">
                        {board.nodeCount} nodes
                      </span>
                    ) : (
                      <span className="rounded bg-secondary/80 px-1.5 py-0.5 text-muted-foreground text-[10px]">
                        Diagram
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock size={10} />
                      {new Date(board.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <span className="flex items-center gap-1 font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight size={11} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* New Board Modal */}
      {isNewBoardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Create Architecture Board</h3>
                  <p className="text-[11px] text-muted-foreground">Choose a name and optional starter template</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewBoardModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Architecture Name
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g. Next-Gen Payments Platform"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">
                  Starter Template
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateId("blank")}
                    className={`rounded-xl border p-2.5 text-left transition-all ${
                      selectedTemplateId === "blank"
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-secondary/20 hover:bg-secondary/50"
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground">Blank Canvas</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Start with a clean slate</p>
                  </button>
                  {ARCHITECTURE_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={`rounded-xl border p-2.5 text-left transition-all ${
                        selectedTemplateId === tmpl.id
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-secondary/20 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground truncate">{tmpl.name}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                        {tmpl.nodeCount} components
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-foreground/80 hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newBoardName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-xs font-semibold text-primary-foreground hover:opacity-90 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <span>Creating...</span>
                  ) : (
                    <>
                      <span>Open Workspace</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
