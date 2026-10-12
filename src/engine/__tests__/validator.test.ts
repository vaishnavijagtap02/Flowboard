import { describe, it, expect } from "vitest";
import { validateMutation } from "../validator";
import type { FlowNode, FlowEdge } from "@/types/canvas";
import type { GraphMutation } from "@/types/mutations";

describe("Graph Mutation Validator", () => {
  const existingNodes: FlowNode[] = [
    {
      id: "srv-auth",
      type: "service",
      position: { x: 100, y: 100 },
      data: { id: "srv-auth", type: "service", name: "Auth Service" },
    },
    {
      id: "db-postgres",
      type: "database",
      position: { x: 300, y: 100 },
      data: { id: "db-postgres", type: "database", name: "User DB" },
    },
  ];

  const existingEdges: FlowEdge[] = [
    {
      id: "e-auth-db",
      source: "srv-auth",
      target: "db-postgres",
      data: { relationship: "writes_to" },
    },
  ];

  describe("ADD_NODE", () => {
    it("approves adding a new node with unique ID", () => {
      const mutation: GraphMutation = {
        action: "ADD_NODE",
        node: {
          id: "queue-kafka",
          type: "queue",
          name: "Kafka Bus",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("rejects adding a duplicate node ID", () => {
      const mutation: GraphMutation = {
        action: "ADD_NODE",
        node: {
          id: "srv-auth",
          type: "service",
          name: "Duplicate Auth",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("already exists");
    });
  });

  describe("REMOVE_NODE", () => {
    it("approves removing an existing node", () => {
      const mutation: GraphMutation = {
        action: "REMOVE_NODE",
        nodeId: "srv-auth",
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(true);
    });

    it("rejects removing a non-existent node", () => {
      const mutation: GraphMutation = {
        action: "REMOVE_NODE",
        nodeId: "non-existent-id",
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not found");
    });
  });

  describe("ADD_EDGE", () => {
    it("approves valid edge between existing nodes", () => {
      const mutation: GraphMutation = {
        action: "ADD_EDGE",
        edge: {
          source: "srv-auth",
          target: "db-postgres",
          relationship: "reads_from",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(true);
    });

    it("rejects self-referencing edge", () => {
      const mutation: GraphMutation = {
        action: "ADD_EDGE",
        edge: {
          source: "srv-auth",
          target: "srv-auth",
          relationship: "connects_to",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Self-referencing");
    });

    it("rejects edge when source node does not exist", () => {
      const mutation: GraphMutation = {
        action: "ADD_EDGE",
        edge: {
          source: "ghost-node",
          target: "db-postgres",
          relationship: "connects_to",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Source node");
    });

    it("rejects edge when target node does not exist", () => {
      const mutation: GraphMutation = {
        action: "ADD_EDGE",
        edge: {
          source: "srv-auth",
          target: "ghost-target",
          relationship: "connects_to",
        },
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Target node");
    });
  });

  describe("REMOVE_EDGE", () => {
    it("approves removing an existing edge", () => {
      const mutation: GraphMutation = {
        action: "REMOVE_EDGE",
        edgeId: "e-auth-db",
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(true);
    });

    it("rejects removing a non-existent edge", () => {
      const mutation: GraphMutation = {
        action: "REMOVE_EDGE",
        edgeId: "missing-edge",
      };

      const result = validateMutation(mutation, existingNodes, existingEdges);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("not found");
    });
  });
});
