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
});
