import { describe, it, expect } from "vitest";
import { lintArchitecture } from "../linter";
import type { SemanticGraph } from "@/types/semantic";

describe("Architecture Linter (Static AST Analysis)", () => {
  it("detects circular synchronous dependency deadlock (A -> B -> C -> A)", () => {
    const cyclicGraph: SemanticGraph = {
      nodes: [
        { id: "srv-a", type: "service", name: "Service A" },
        { id: "srv-b", type: "service", name: "Service B" },
        { id: "srv-c", type: "service", name: "Service C" },
      ],
      edges: [
        { id: "e-ab", source: "srv-a", target: "srv-b", relationship: "connects_to" },
        { id: "e-bc", source: "srv-b", target: "srv-c", relationship: "connects_to" },
        { id: "e-ca", source: "srv-c", target: "srv-a", relationship: "connects_to" },
      ],
    };

    const report = lintArchitecture(cyclicGraph);
    const cycleIssue = report.issues.find((i) => i.code === "SYNC_CALL_CYCLE");

    expect(cycleIssue).toBeDefined();
    expect(cycleIssue?.severity).toBe("error");
    expect(report.score).toBeLessThan(100);
  });

  it("detects client directly connecting to internal database bypass", () => {
    const unsecureGraph: SemanticGraph = {
      nodes: [
        { id: "cli-web", type: "client", name: "Web App" },
        { id: "db-main", type: "database", name: "Primary Database" },
      ],
      edges: [
        { id: "e-client-db", source: "cli-web", target: "db-main", relationship: "reads_from" },
      ],
    };

    const report = lintArchitecture(unsecureGraph);
    const dbBypass = report.issues.find((i) => i.code === "CLIENT_DIRECT_DATABASE_ACCESS");

    expect(dbBypass).toBeDefined();
    expect(dbBypass?.severity).toBe("error");
    expect(dbBypass?.recommendation).toContain("API Gateway");
  });

  it("flags orphan components with no connections", () => {
    const orphanGraph: SemanticGraph = {
      nodes: [
        { id: "srv-auth", type: "service", name: "Auth Service" },
        { id: "db-auth", type: "database", name: "Auth DB" },
        { id: "srv-orphan", type: "service", name: "Zombie Service" },
      ],
      edges: [
        { id: "e1", source: "srv-auth", target: "db-auth", relationship: "writes_to" },
      ],
    };

    const report = lintArchitecture(orphanGraph);
    const orphanIssue = report.issues.find((i) => i.code === "ORPHAN_COMPONENT");

    expect(orphanIssue).toBeDefined();
    expect(orphanIssue?.affectedNodeIds).toContain("srv-orphan");
  });

  it("gives a clean score for a well-architected tiered system with producers and consumers", () => {
    const healthyGraph: SemanticGraph = {
      nodes: [
        { id: "client-mobile", type: "client", name: "Mobile App" },
        { id: "gw-api", type: "gateway", name: "Kong Gateway" },
        { id: "srv-orders", type: "service", name: "Orders Service" },
        { id: "queue-events", type: "queue", name: "Event Bus" },
        { id: "srv-worker", type: "service", name: "Worker Service" },
        { id: "db-orders", type: "database", name: "Orders DB" },
      ],
      edges: [
        { id: "e1", source: "client-mobile", target: "gw-api", relationship: "connects_to" },
        { id: "e2", source: "gw-api", target: "srv-orders", relationship: "connects_to" },
        { id: "e3", source: "srv-orders", target: "db-orders", relationship: "writes_to" },
        { id: "e4", source: "srv-orders", target: "queue-events", relationship: "publishes_to" },
        { id: "e5", source: "queue-events", target: "srv-worker", relationship: "subscribes_to" },
      ],
    };

    const report = lintArchitecture(healthyGraph);
    expect(report.summary.errorsCount).toBe(0);
    expect(report.score).toBeGreaterThanOrEqual(90);
  });
});
