import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { SimulationNodeData, SimulationParams, SimulationResult, TimeSeriesDataPoint } from '@/types';
import { prepareSimulation, simulateTick, finalizeSimulation, SimulationContext } from '@/lib/core';

export function useSimulation(
  nodes: Node<SimulationNodeData>[],
  edges: Edge[],
  simulationParams: SimulationParams,
  setNodes: React.Dispatch<React.SetStateAction<Node<SimulationNodeData>[]>>
) {
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simProgress, setSimProgress] = useState<{ elapsed: number; total: number } | null>(null);
  const [liveTimeSeries, setLiveTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simContextRef = useRef<SimulationContext | null>(null);
  const simTickRef = useRef<{ second: number; series: TimeSeriesDataPoint[] }>({ second: 0, series: [] });

  const stopSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsRunning(false);
    setSimProgress(null);
  }, []);

  const handleRunSimulation = useCallback(() => {
    stopSimulation();
    setIsRunning(true);
    setSimulationResult(null);
    setLiveTimeSeries([]);
    setSimProgress({ elapsed: 0, total: simulationParams.simulationDurationSeconds });

    const ctx = prepareSimulation(nodes, edges, simulationParams);
    simContextRef.current = ctx;
    simTickRef.current = { second: 0, series: [] };

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, metrics: ctx.nodeMetrics[n.id] || undefined },
      }))
    );

    simIntervalRef.current = setInterval(() => {
      const { second, series } = simTickRef.current;
      const duration = simulationParams.simulationDurationSeconds;

      const point = simulateTick(ctx, second);
      const newSeries = [...series, point];
      simTickRef.current = { second: second + 1, series: newSeries };

      setLiveTimeSeries(newSeries);
      setSimProgress({ elapsed: second + 1, total: duration });

      if (second + 1 >= duration) {
        stopSimulation();
        const result = finalizeSimulation(ctx, newSeries, simulationParams);
        setSimulationResult(result);
        setLiveTimeSeries([]);
        setIsRunning(false);
        setSimProgress(null);
      }
    }, 1000);
  }, [nodes, edges, simulationParams, setNodes, stopSimulation]);

  const handleReset = useCallback(() => {
    setSimulationResult(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, metrics: undefined },
      }))
    );
  }, [setNodes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  return {
    simulationResult,
    setSimulationResult,
    isRunning,
    simProgress,
    liveTimeSeries,
    handleRunSimulation,
    stopSimulation,
    handleReset,
  };
}
