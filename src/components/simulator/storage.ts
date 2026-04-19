import type { Edge, Node } from "@xyflow/react";
import type { SimulationNodeData, SimulationParams } from "@/lib/types";
import { STORAGE_KEY } from "./constants";

export function loadFromStorage(): { nodes: Node<SimulationNodeData>[]; edges: Edge[]; params: SimulationParams } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveToStorage(nodes: Node<SimulationNodeData>[], edges: Edge[], params: SimulationParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, params }));
  } catch {
    // Quota exceeded or storage unavailable; intentionally ignore.
  }
}
