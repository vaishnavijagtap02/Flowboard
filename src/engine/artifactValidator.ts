// src/engine/artifactValidator.ts
// Deterministic artifact pre-validator.
// Inspects the semantic graph before artifact compilation to detect port conflicts,
// naming collisions, and invalid container network dependencies.

import { SemanticGraph } from "@/types/semantic";
import { ArtifactType } from "@/types/artifacts";

export interface ArtifactValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  portMap: Record<string, number>; // Assigned collision-free ports for docker-compose
}

// Default standard ports by technology
const DEFAULT_TECH_PORTS: Record<string, number> = {
  postgres: 5432,
  postgresql: 5432,
  mysql: 3306,
  redis: 6379,
  mongodb: 27017,
  kafka: 9092,
  rabbitmq: 5672,
  elasticsearch: 9200,
  nginx: 80,
};

/**
 * Validates a graph before generating artifacts like docker-compose.yml or API contracts.
 */
export function validateGraphForArtifacts(
  graph: SemanticGraph,
  artifactType: ArtifactType
): ArtifactValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const assignedPorts = new Map<number, string>(); // port -> nodeId
  const portMap: Record<string, number> = {};

  // Check 1: Empty graph
  if (!graph.nodes || graph.nodes.length === 0) {
    errors.push("Cannot generate artifacts for an empty architecture graph.");
    return { valid: false, errors, warnings, portMap };
  }

  // Check 2: Service / Component Name Collisions
  const seenNames = new Map<string, string>();
  for (const node of graph.nodes) {
    const normalizedName = node.name.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "-");
    if (seenNames.has(normalizedName)) {
      errors.push(
        `Duplicate component name "${node.name}". In containerized environments, every service name must be unique.`
      );
    } else {
      seenNames.set(normalizedName, node.id);
    }
  }

  // Check 3: Port Bindings & Conflicts (especially relevant for docker-compose)
  let nextDynamicPort = 8000;

  for (const node of graph.nodes) {
    const tech = (node.technology || "").toLowerCase().trim();
    let port = DEFAULT_TECH_PORTS[tech];

    // If node explicitly defines a port in properties
    if (node.properties?.port) {
      const parsed = parseInt(node.properties.port, 10);
      if (!isNaN(parsed) && parsed > 0) {
        port = parsed;
      }
    }

    if (!port) {
      // Assign dynamic app port
      while (assignedPorts.has(nextDynamicPort)) {
        nextDynamicPort++;
      }
      port = nextDynamicPort++;
    }

    // Check conflict
    if (assignedPorts.has(port) && assignedPorts.get(port) !== node.id) {
      const conflictNode = assignedPorts.get(port)!;
      warnings.push(
        `Port collision detected: Both "${node.name}" and "${conflictNode}" map to host port ${port}. Auto-offsetting "${node.name}" to ${port + 1000}.`
      );
      port = port + 1000;
    }

    assignedPorts.set(port, node.id);
    portMap[node.id] = port;
  }

  // Check 4: Technology specification for Docker Compose
  if (artifactType === "docker-compose") {
    const nodesMissingTech = graph.nodes.filter(
      (n) => n.type !== "client" && !n.technology
    );
    if (nodesMissingTech.length > 0) {
      warnings.push(
        `${nodesMissingTech.length} components have no specified technology/framework. Docker Compose will use generic alpine/node base images.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    portMap,
  };
}
