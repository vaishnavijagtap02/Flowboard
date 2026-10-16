import { describe, it, expect } from "vitest";
import { parseMutationPlan, processAndApplyMutations } from "../mutationEngine";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { AIMutationPlan } from "@/types/mutations";

describe("Mutation Engine (Safe Agentic Graph Patching)", () => {
  it("parses valid JSON with markdown code fences into an AIMutationPlan", () => {
    const rawPayload = `\`\`\`json
    {
      "explanation": "Added Redis cache to offload database reads",
      "mutations": [
        {
          "action": "ADD_NODE",
          "node": {
            "id": "cache-redis",
            "type": "cache",
            "name": "Redis Cache Layer",
            "technology": "Redis 7.2"
          }
        }
      ]
    }
    \`\`\``;

    const parsed = parseMutationPlan(rawPayload);
    expect(parsed).not.toBeNull();
    expect(parsed?.explanation).toContain("Redis");
    expect(parsed?.mutations).toHaveLength(1);
    expect(parsed?.mutations[0].action).toBe("ADD_NODE");
  });

  it("applies sequential mutations where ADD_NODE immediately enables subsequent ADD_EDGE", () => {
    const existingNodes: FlowNode[] = [
      {
        id: "srv-api",
        type: "service",
        position: { x: 100, y: 100 },
        data: { id: "srv-api", type: "service", name: "API Gateway" },
      },
    ];
    const existingEdges: FlowEdge[] = [];

    const plan: AIMutationPlan = {
      explanation: "Add auth service and connect API Gateway to it",
      mutations: [
        {
          action: "ADD_NODE",
          node: {
            id: "srv-auth",
            type: "service",
            name: "Auth Microservice",
          },
        },
        {
          action: "ADD_EDGE",
          edge: {
            source: "srv-api",
            target: "srv-auth",
            relationship: "connects_to",
            label: "validate tokens",
          },
        },
      ],
    };

    const { nodes, edges, result } = processAndApplyMutations(
      plan,
      existingNodes,
      existingEdges
    );

    expect(result.applied).toHaveLength(2);
    expect(result.rejected).toHaveLength(0);
    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("srv-api");
    expect(edges[0].target).toBe("srv-auth");
  });

  it("drops invalid mutations gracefully without corrupting existing graph state", () => {
    const existingNodes: FlowNode[] = [
      {
        id: "srv-main",
        type: "service",
        position: { x: 100, y: 100 },
        data: { id: "srv-main", type: "service", name: "Main Service" },
      },
    ];

    const invalidPlan: AIMutationPlan = {
      explanation: "Attempting to connect to a non-existent target node",
      mutations: [
        {
          action: "ADD_EDGE",
          edge: {
            source: "srv-main",
            target: "ghost-target-id",
            relationship: "connects_to",
          },
        },
      ],
    };

    const { nodes, edges, result } = processAndApplyMutations(
      invalidPlan,
      existingNodes,
      []
    );

    expect(result.applied).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0].reason).toContain("Target node");
    // Original state untouched
    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });

  it("self-heals imperfect LLM output with lowercase actions and synonym types", () => {
    const rawAiOutput = `
    {
      "mutations": [
        {
          "action": "add_node",
          "node": {
            "name": "Web Client",
            "type": "frontend"
          }
        },
        {
          "action": "add_node",
          "node": {
            "id": "srv-backend",
            "name": "API Backend",
            "type": "microservice"
          }
        },
        {
          "action": "add_edge",
          "edge": {
            "source": "web-client",
            "target": "srv-backend",
            "relationship": "calls"
          }
        }
      ]
    }
    `;

    const parsed = parseMutationPlan(rawAiOutput);
    expect(parsed).not.toBeNull();
    expect(parsed?.mutations).toHaveLength(3);
    expect(parsed?.mutations[0].action).toBe("ADD_NODE");
    expect((parsed?.mutations[0] as { node: { type: string } }).node.type).toBe("client");
    expect((parsed?.mutations[1] as { node: { type: string } }).node.type).toBe("service");
    expect((parsed?.mutations[2] as { edge: { relationship: string } }).edge.relationship).toBe("connects_to");
  });

  it("computes spacious non-overlapping positions when adding multiple new nodes", () => {
    const existingNodes: FlowNode[] = [
      {
        id: "db-main",
        type: "database",
        position: { x: 500, y: 300 },
        data: { id: "db-main", type: "database", name: "PostgreSQL DB" },
      },
    ];

    const plan: AIMutationPlan = {
      explanation: "Add multiple microservices",
      mutations: [
        { action: "ADD_NODE", node: { id: "srv-a", type: "service", name: "Service A" } },
        { action: "ADD_NODE", node: { id: "srv-b", type: "service", name: "Service B" } },
        { action: "ADD_EDGE", edge: { source: "srv-a", target: "db-main", relationship: "writes_to" } },
        { action: "ADD_EDGE", edge: { source: "srv-b", target: "db-main", relationship: "reads_from" } },
      ],
    };

    const { nodes } = processAndApplyMutations(plan, existingNodes, []);
    expect(nodes).toHaveLength(3);

    // Verify nodes are not stacked right on top of each other
    const srvA = nodes.find((n) => n.id === "srv-a")!;
    const srvB = nodes.find((n) => n.id === "srv-b")!;
    const distance = Math.hypot(srvA.position.x - srvB.position.x, srvA.position.y - srvB.position.y);
    expect(distance).toBeGreaterThan(150);
  });
});
