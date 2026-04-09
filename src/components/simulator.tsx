'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  NodeTypes,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SimulationNodeData, SimulationParams, SimulationResult, ComponentType, TimeSeriesDataPoint } from '@/lib/types';
import { COMPONENT_DEFAULTS, COMPONENT_LABELS, COMPONENT_COLORS } from '@/lib/services-catalog';
import { prepareSimulation, simulateTick, finalizeSimulation, SimulationContext } from '@/lib/simulation-engine';
import { PRESETS } from '@/lib/presets';

import InfraNode from './infra-node';
import ComponentPalette from './component-palette';
import ConfigPanel from './config-panel';
import SimulationControls from './simulation-controls';
import ReportPanel from './report-panel';
import LiveClientPanel from './live-client-panel';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LayoutGrid,
  Settings2,
  BarChart3,
  Boxes,
  Cpu,
  Zap,
} from 'lucide-react';

const nodeTypes: NodeTypes = {
  infra: InfraNode,
};

let nodeIdCounter = 0;

function useResizable(initial: number, min: number, max: number, inverted = false) {
  const sizeRef = useRef(initial);
  const [size, setSize] = useState(initial);
  const startX = useRef(0);
  const startSize = useRef(initial);

  useEffect(() => { sizeRef.current = size; }, [size]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startSize.current = sizeRef.current;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      const delta = (ev.clientX - startX.current) * (inverted ? -1 : 1);
      const next = Math.min(max, Math.max(min, startSize.current + delta));
      sizeRef.current = next;
      setSize(next);
    };
    const onMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [min, max, inverted]);

  return { size, onMouseDown };
}

const STORAGE_KEY = 'hld-simulator-state';

function loadFromStorage(): { nodes: Node<SimulationNodeData>[]; edges: Edge[]; params: SimulationParams } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(nodes: Node<SimulationNodeData>[], edges: Edge[], params: SimulationParams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges, params }));
  } catch { /* quota exceeded — ignore */ }
}

const DEFAULT_PARAMS: SimulationParams = {
  concurrentUsers: 100,
  requestsPerSecPerUser: 1,
  payloadSizeMB: 0.1,
  simulationDurationSeconds: 60,
  loadProfile: 'constant',
  spikeFrequency: 3,
  spikeIntensity: 3,
};

export default function Simulator() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SimulationNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<SimulationNodeData> | null>(null);
  const [simulationParams, setSimulationParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [hydrated, setHydrated] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simProgress, setSimProgress] = useState<{ elapsed: number; total: number } | null>(null);
  const [liveTimeSeries, setLiveTimeSeries] = useState<TimeSeriesDataPoint[]>([]);
  const simIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simContextRef = useRef<SimulationContext | null>(null);
  const simTickRef = useRef<{ second: number; series: TimeSeriesDataPoint[] }>({ second: 0, series: [] });
  const [rightTab, setRightTab] = useState('components');
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance<Node<SimulationNodeData>, Edge> | null>(null);

  // Restore from localStorage after first client-side mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setNodes(saved.nodes.map((n) => ({ ...n, data: { ...n.data, metrics: undefined } })));
      setEdges(saved.edges);
      setSimulationParams(saved.params);
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state to localStorage on every change (only after hydration to avoid overwriting with empty state)
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage(nodes, edges, simulationParams);
  }, [nodes, edges, simulationParams, hydrated]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as Node<SimulationNodeData>);
      setRightTab('config');
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const addComponent = useCallback(
    (type: ComponentType, position?: { x: number; y: number }) => {
      const id = `node_${++nodeIdCounter}_${Date.now()}`;
      const newNode: Node<SimulationNodeData> = {
        id,
        type: 'infra',
        position: position || {
          x: 250 + Math.random() * 200,
          y: 100 + nodes.length * 120,
        },
        data: {
          label: COMPONENT_LABELS[type],
          componentType: type,
          config: {
            serviceId: COMPONENT_DEFAULTS[type],
            cacheHitRate: type === 'cache' ? 0.8 : undefined,
            queueProcessingTimeMs: type === 'message_queue' ? 100 : undefined,
          },
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type') as ComponentType;
      if (!type) return;

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = reactFlowRef.current?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }) || { x: event.clientX - reactFlowBounds.left, y: event.clientY - reactFlowBounds.top };

      addComponent(type, position);
    },
    [addComponent]
  );

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<SimulationNodeData>) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === nodeId) {
            const newData = { ...n.data };
            if (updates.label !== undefined) newData.label = updates.label;
            if (updates.config !== undefined) newData.config = { ...newData.config, ...updates.config };
            if (updates.metrics !== undefined) newData.metrics = updates.metrics;
            return { ...n, data: newData };
          }
          return n;
        })
      );
      // Update selected node reference
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode((prev) => {
          if (!prev) return prev;
          const newData = { ...prev.data };
          if (updates.label !== undefined) newData.label = updates.label;
          if (updates.config !== undefined) newData.config = { ...newData.config, ...updates.config };
          if (updates.metrics !== undefined) newData.metrics = updates.metrics;
          return { ...prev, data: newData };
        });
      }
    },
    [setNodes, selectedNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

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
    setRightTab('report');

    const ctx = prepareSimulation(nodes, edges, simulationParams);
    simContextRef.current = ctx;
    simTickRef.current = { second: 0, series: [] };

    // Apply static node metrics immediately so canvas updates
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

  const loadPreset = useCallback(
    (presetId: string | null) => {
      if (!presetId) return;
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      setNodes(preset.nodes as Node<SimulationNodeData>[]);
      setEdges(
        preset.edges.map((e) => ({
          ...e,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }))
      );
      setSimulationParams(preset.simulationParams);
      setSimulationResult(null);
      setSelectedNode(null);

      // Fit view after loading
      setTimeout(() => {
        reactFlowRef.current?.fitView({ padding: 0.2 });
      }, 100);
    },
    [setNodes, setEdges]
  );

  const selectedNodeForPanel = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode.id) || null;
  }, [selectedNode, nodes]);

  const leftPanel = useResizable(256, 180, 480, false);
  const rightPanel = useResizable(288, 220, 560, true);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-12 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h1 className="font-bold text-gray-800">HLD Simulator</h1>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {nodes.length} components
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {edges.length} connections
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Select onValueChange={loadPreset}>
            <SelectTrigger className="h-8 text-xs w-[200px]">
              <SelectValue placeholder="Load a preset..." />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="border-r bg-white flex flex-col flex-shrink-0" style={{ width: leftPanel.size }}>
          <div className="p-3 flex-shrink-0">
            <SimulationControls
              params={simulationParams}
              onParamsChange={setSimulationParams}
              onRun={handleRunSimulation}
              onStop={stopSimulation}
              onReset={handleReset}
              isRunning={isRunning}
              hasResults={!!simulationResult}
              simProgress={simProgress}
            />
          </div>
        </div>

        {/* Left Resize Handle */}
        <div
          onMouseDown={leftPanel.onMouseDown}
          className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors relative z-10 group"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-y-0 -left-2 -right-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-3 bg-white rounded-full" />
            <div className="w-0.5 h-3 bg-white rounded-full" />
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: { ...n.data, highlighted: n.id === highlightedNodeId },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={(instance) => { reactFlowRef.current = instance as unknown as ReactFlowInstance<Node<SimulationNodeData>, Edge>; }}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{
              animated: false,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            }}
            className="bg-gray-50"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
            <Controls className="!bg-white !border !shadow-md !rounded-lg" />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as SimulationNodeData;
                return COMPONENT_COLORS[data.componentType] || '#6366f1';
              }}
              className="!bg-white !border !shadow-md !rounded-lg"
              maskColor="rgba(0,0,0,0.05)"
            />
            <Panel position="top-center">
              {nodes.length === 0 && (
                <div className="bg-white/90 backdrop-blur-sm border rounded-xl px-6 py-4 shadow-lg text-center">
                  <Boxes className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    Design your system architecture
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Drag components from the right panel, or load a preset from the top bar
                  </p>
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>

        {/* Right Resize Handle */}
        <div
          onMouseDown={rightPanel.onMouseDown}
          className="w-1.5 flex-shrink-0 cursor-col-resize bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors relative z-10 group"
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-y-0 -left-2 -right-2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-0.5 h-3 bg-white rounded-full" />
            <div className="w-0.5 h-3 bg-white rounded-full" />
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="border-l bg-white flex flex-col flex-shrink-0" style={{ width: rightPanel.size }}>
          <Tabs value={rightTab} onValueChange={(val) => setRightTab(val as string)} className="flex flex-col h-full">
            <TabsList className="flex-shrink-0 m-2 grid grid-cols-4">
              <TabsTrigger value="components" className="text-xs gap-1">
                <LayoutGrid className="w-3 h-3" />
                Add
              </TabsTrigger>
              <TabsTrigger value="live" className="text-xs gap-1">
                <Zap className="w-3 h-3" />
                Live
              </TabsTrigger>
              <TabsTrigger value="config" className="text-xs gap-1">
                <Settings2 className="w-3 h-3" />
                Config
              </TabsTrigger>
              <TabsTrigger value="report" className="text-xs gap-1">
                <BarChart3 className="w-3 h-3" />
                Report
              </TabsTrigger>
            </TabsList>

            <TabsContent value="components" className="flex-1 overflow-hidden m-0 p-3">
              <ComponentPalette onAddComponent={addComponent} />
            </TabsContent>

            <TabsContent value="live" className="flex-1 overflow-hidden m-0 min-h-0">
              <LiveClientPanel
                nodes={nodes}
                edges={edges}
                onHighlightNode={setHighlightedNodeId}
              />
            </TabsContent>

            <TabsContent value="config" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ConfigPanel
                  node={selectedNodeForPanel}
                  onUpdate={updateNode}
                  onDelete={deleteNode}
                />
              </ScrollArea>
            </TabsContent>

            <TabsContent value="report" className="flex-1 overflow-hidden m-0">
              <ReportPanel result={simulationResult} liveTimeSeries={liveTimeSeries} isRunning={isRunning} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
