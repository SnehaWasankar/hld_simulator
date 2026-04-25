import { Node, Edge } from '@xyflow/react';
import { SimulationNodeData, SimulationParams } from '@/types';

const STORAGE_KEY = 'archscope-state';

export interface StoredState {
  nodes: Node<SimulationNodeData>[];
  edges: Edge[];
  params: SimulationParams;
}

export function loadFromStorage(): StoredState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveToStorage(
  nodes: Node<SimulationNodeData>[],
  edges: Edge[],
  params: SimulationParams
): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, params }));
  } catch {
    /* quota exceeded — ignore */
  }
}

export const DEFAULT_PARAMS: SimulationParams = {
  concurrentUsers: 100,
  requestsPerSecPerUser: 1,
  payloadSizeMB: 0.1,
  simulationDurationSeconds: 60,
  loadProfile: 'constant',
  spikeFrequency: 3,
  spikeIntensity: 3,
};

export function getUserColor(seed: string) {
  const colors = [
    { bg: 'bg-blue-500/20', text: 'text-blue-800', border: 'border-blue-200', hover: 'hover:bg-blue-500/10 hover:border-blue-400' },
    { bg: 'bg-pink-500/20', text: 'text-pink-800', border: 'border-pink-200', hover: 'hover:bg-pink-500/10 hover:border-pink-400' },
    { bg: 'bg-green-500/20', text: 'text-green-800', border: 'border-green-200', hover: 'hover:bg-green-500/10 hover:border-green-400' },
    { bg: 'bg-purple-500/20', text: 'text-purple-800', border: 'border-purple-200', hover: 'hover:bg-purple-500/10 hover:border-purple-400' },
    { bg: 'bg-orange-500/20', text: 'text-orange-800', border: 'border-orange-200', hover: 'hover:bg-orange-500/10 hover:border-orange-400' },
  ];

  // simple hash from email
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}
