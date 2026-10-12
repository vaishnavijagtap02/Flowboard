import { describe, it, expect } from "vitest";
import { serializeForAI } from "../serializer";
import type { FlowNode, FlowEdge } from "@/types/canvas";

describe("Graph Serializer (LLM Context Optimization)", () => {
  it("strips UI and visual coordinates while preserving semantic attributes", () => {
    const nodes: FlowNode[] = [
      {
        id: "srv-orders",
        type: "service",
        position: { x: 540, y: 320 },
        data: {
          id: "srv-orders",
          type: "service",
          name: "Orders Service",
          technology: "Node.js / Express",
          description: "Handles checkout and order placement",
          responsibilities: ["Validate carts", "Emit order.created event"],
        },
      },
    ];

    const edges: FlowEdge[] = [
      {
        id: "e-orders-db",
        source: "srv-orders",
        target: "db-orders",
        data: {
          relationship: "writes_to",
          protocol: "PostgreSQL Wire Protocol",
          label: "persist",
        },
      },
    ];

    const serialized = serializeForAI(nodes, edges);

    // Assert visual coordinates stripped
    expect((serialized.nodes[0] as unknown as Record<string, unknown>).position).toBeUndefined();

    // Assert semantic metadata preserved
    expect(serialized.nodes[0].name).toBe("Orders Service");
    expect(serialized.nodes[0].technology).toBe("Node.js / Express");
    expect(serialized.nodes[0].responsibilities).toEqual([
      "Validate carts",
      "Emit order.created event",
    ]);

    // Assert edge relations preserved
    expect(serialized.edges[0].relationship).toBe("writes_to");
    expect(serialized.edges[0].protocol).toBe("PostgreSQL Wire Protocol");
  });

  it("sorts nodes deterministically by ID", () => {
    const nodes: FlowNode[] = [
      {
        id: "zeta-service",
        type: "service",
        position: { x: 0, y: 0 },
        data: { id: "zeta-service", type: "service", name: "Zeta" },
      },
      {
        id: "alpha-service",
        type: "service",
        position: { x: 0, y: 0 },
        data: { id: "alpha-service", type: "service", name: "Alpha" },
      },
      {
        id: "beta-service",
        type: "service",
        position: { x: 0, y: 0 },
        data: { id: "beta-service", type: "service", name: "Beta" },
      },
    ];

    const serialized = serializeForAI(nodes, []);
    expect(serialized.nodes.map((n) => n.id)).toEqual([
      "alpha-service",
      "beta-service",
      "zeta-service",
    ]);
  });

  it("handles empty graphs without error", () => {
    const serialized = serializeForAI([], []);
    expect(serialized.nodes).toEqual([]);
    expect(serialized.edges).toEqual([]);
  });
});
