import { describe, it, expect } from "vitest";
import { AIMutationPlanSchema } from "@/schemas/mutations";
import { parseMutationPlan, processAndApplyMutations } from "../mutationEngine";
import { validateMutation } from "../validator";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { AIMutationPlan } from "@/types/mutations";

describe("Vision Scanner Architecture Extraction & Plan Application", () => {
  it("validates a structured vision mutation plan against AIMutationPlanSchema", () => {
    const rawVisionPlan: AIMutationPlan = {
      explanation: "Scanned 4-tier cloud architecture from whiteboard screenshot with API Gateway, Core Service, Redis, and PostgreSQL.",
      mutations: [
        {
          action: "ADD_NODE",
          node: {
            id: "gw-ingress",
            type: "gateway",
            name: "Cloud Ingress Gateway",
            technology: "Kong / Envoy",
            description: "Reverse proxy & TLS termination",
          },
        },
        {
          action: "ADD_NODE",
          node: {
            id: "srv-orders",
            type: "service",
            name: "Order Processing Engine",
            technology: "Go 1.22",
            description: "Handles checkout orchestration",
          },
        },
        {
          action: "ADD_NODE",
          node: {
            id: "cache-redis",
            type: "cache",
            name: "Redis Cluster",
            technology: "Redis 7.2",
            description: "Session and query cache",
          },
        },
        {
          action: "ADD_NODE",
          node: {
            id: "db-postgres",
            type: "database",
            name: "Orders Database",
            technology: "PostgreSQL 16",
            description: "Relational order and item records",
          },
        },
        {
          action: "ADD_EDGE",
          edge: {
            source: "gw-ingress",
            target: "srv-orders",
            relationship: "connects_to",
            label: "HTTPS proxy",
            protocol: "HTTP/2",
          },
        },
        {
          action: "ADD_EDGE",
          edge: {
            source: "srv-orders",
            target: "cache-redis",
            relationship: "reads_from",
            label: "check cache",
            protocol: "RESP",
          },
        },
        {
          action: "ADD_EDGE",
          edge: {
            source: "srv-orders",
            target: "db-postgres",
            relationship: "writes_to",
            label: "commit orders",
            protocol: "TCP",
          },
        },
      ],
    };

    const parseResult = AIMutationPlanSchema.safeParse(rawVisionPlan);
    expect(parseResult.success).toBe(true);
    if (!parseResult.success) return;

    expect(parseResult.data.mutations).toHaveLength(7);
  });

  it("parses raw vision response enclosed in markdown code fences into an AIMutationPlan", () => {
    const markdownResponse = `Here is the reconstructed architecture from your meeting whiteboard:
\`\`\`json
{
  "explanation": "Detected microservices topology with message bus.",
  "mutations": [
    {
      "action": "ADD_NODE",
      "node": {
        "id": "srv-billing",
        "type": "service",
        "name": "Billing Service",
        "technology": "Node.js / Express"
      }
    },
    {
      "action": "ADD_NODE",
      "node": {
        "id": "queue-kafka",
        "type": "queue",
        "name": "Event Stream",
        "technology": "Apache Kafka"
      }
    },
    {
      "action": "ADD_EDGE",
      "edge": {
        "source": "srv-billing",
        "target": "queue-kafka",
        "relationship": "publishes_to",
        "label": "invoice.generated"
      }
    }
  ]
}
\`\`\``;

    const parsedPlan = parseMutationPlan(markdownResponse);
    expect(parsedPlan).not.toBeNull();
    expect(parsedPlan?.mutations).toHaveLength(3);
    expect(parsedPlan?.explanation).toContain("microservices topology");
  });

  it("successfully applies extracted vision plan to blank canvas state", () => {
    const nodes: FlowNode[] = [];
    const edges: FlowEdge[] = [];

    const plan: AIMutationPlan = {
      explanation: "Whiteboard OCR scan applied",
      mutations: [
        {
          action: "ADD_NODE",
          node: {
            id: "client-mobile",
            type: "client",
            name: "iOS & Android App",
            technology: "React Native",
          },
        },
        {
          action: "ADD_NODE",
          node: {
            id: "api-bff",
            type: "api",
            name: "Mobile BFF",
            technology: "GraphQL",
          },
        },
        {
          action: "ADD_EDGE",
          edge: {
            source: "client-mobile",
            target: "api-bff",
            relationship: "connects_to",
            label: "GraphQL Queries",
          },
        },
      ],
    };

    const { nodes: updatedNodes, edges: updatedEdges, result: mutationResult } =
      processAndApplyMutations(plan, nodes, edges);
    expect(mutationResult.applied).toHaveLength(3);
    expect(mutationResult.rejected).toHaveLength(0);
    expect(updatedNodes).toHaveLength(2);
    expect(updatedEdges).toHaveLength(1);
    expect(updatedEdges[0].source).toBe("client-mobile");
    expect(updatedEdges[0].target).toBe("api-bff");
  });

  it("safely catches and rejects invalid edges in vision output referencing non-existent nodes", () => {
    const nodes: FlowNode[] = [
      {
        id: "srv-existing",
        type: "service",
        position: { x: 0, y: 0 },
        data: { id: "srv-existing", type: "service", name: "Existing Service" },
      },
    ];
    const edges: FlowEdge[] = [];

    const invalidEdgeMutation = {
      action: "ADD_EDGE" as const,
      edge: {
        source: "srv-existing",
        target: "srv-ghost-node",
        relationship: "connects_to" as const,
        label: "bad connection",
      },
    };

    const validation = validateMutation(invalidEdgeMutation, nodes, edges);
    expect(validation.valid).toBe(false);
    expect(validation.reason).toContain("not found");
  });
});
