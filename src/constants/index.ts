// Application constants and configuration

export const APP_CONFIG = {
  name: 'ArchScope',
  version: '0.1.0',
  description: 'Interactive system architecture simulator',
} as const;

export const SIMULATION_CONFIG = {
  defaultRequestsPerSecond: 1000,
  maxRequestsPerSecond: 100000,
  simulationDuration: 60, // seconds
} as const;

export const UI_CONFIG = {
  maxCanvasWidth: 2000,
  maxCanvasHeight: 2000,
  nodeSize: 80,
  gridSize: 20,
} as const;
