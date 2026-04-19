import type { SimulationParams } from "@/lib/types";

export const STORAGE_KEY = "archscope-state";

export const DEFAULT_PARAMS: SimulationParams = {
  concurrentUsers: 100,
  requestsPerSecPerUser: 1,
  payloadSizeMB: 0.1,
  simulationDurationSeconds: 60,
  loadProfile: "constant",
  spikeFrequency: 3,
  spikeIntensity: 3,
};
