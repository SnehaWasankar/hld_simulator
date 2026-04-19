import type { GraphNode, SimulateRequestBody } from "./types";

export function traverseGraph(
  nodes: SimulateRequestBody["graph"]["nodes"],
  edges: SimulateRequestBody["graph"]["edges"]
): string[] {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  const entryNodes = nodes
    .filter((n) => n.componentType === "client" || ((inDegree.get(n.id) ?? 0) === 0 && (adjacency.get(n.id)?.length ?? 0) > 0))
    .map((n) => n.id);

  const visited = new Set<string>();
  const order: string[] = [];
  const queue = [...entryNodes];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);

    const children = adjacency.get(current) ?? [];
    for (const child of children) {
      if (!visited.has(child)) queue.push(child);
    }
  }

  return order;
}

export function detectParallelWarnings(
  graph: SimulateRequestBody["graph"],
  nodeMap: Map<string, GraphNode>
): string[] {
  const parallelWarnings: string[] = [];
  const edgesBySource = new Map<string, Array<{ target: string; targetType: string }>>();

  for (const edge of graph.edges) {
    const targetNode = nodeMap.get(edge.target);
    if (!targetNode) continue;

    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }

    edgesBySource.get(edge.source)!.push({
      target: edge.target,
      targetType: targetNode.componentType,
    });
  }

  for (const [sourceId, targets] of edgesBySource) {
    const sourceNode = nodeMap.get(sourceId);
    if (!sourceNode) continue;

    const targetsByType = new Map<string, string[]>();
    for (const target of targets) {
      if (!targetsByType.has(target.targetType)) {
        targetsByType.set(target.targetType, []);
      }
      targetsByType.get(target.targetType)!.push(target.target);
    }

    const problematicTypes = ["api_server", "worker"];
    for (const [targetType, targetIds] of targetsByType) {
      if (problematicTypes.includes(targetType) && targetIds.length > 1) {
        if (sourceNode.componentType !== "load_balancer") {
          parallelWarnings.push(
            `⚠️ ${targetIds.length} ${targetType.replace("_", " ")}s connected directly to ${sourceNode.label} without a load balancer. Each will receive the FULL payload simultaneously. Consider adding a load balancer to distribute traffic.`
          );
        }
      }
    }
  }

  return parallelWarnings;
}
