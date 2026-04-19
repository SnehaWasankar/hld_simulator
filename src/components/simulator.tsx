'use client';

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Link from 'next/link';
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
import { SimpleUndoRedo } from './simple-undo-redo';
import { DEFAULT_PARAMS } from './simulator/constants';
import { loadFromStorage } from './simulator/storage';
import { useResizable } from './simulator/use-resizable';
import { useKeyboardShortcuts } from './simulator/use-keyboard-shortcuts';

import InfraNode from './infra-node';
import ComponentPalette from './component-palette';
import ConfigPanel from './config-panel';
import SimulationControls from './simulation-controls';
import ReportPanel from './report-panel';
import LiveClientPanel from './live-client-panel';
import SelectionBox from './selection-box';

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
  Network,
  Zap,
  BookOpen,
} from 'lucide-react';

const nodeTypes: NodeTypes = {
  infra: InfraNode,
};

let nodeIdCounter = 0;

export default function Simulator() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<SimulationNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNode, setSelectedNode] = useState<Node<SimulationNodeData> | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [clipboard, setClipboard] = useState<{ nodes: Node<SimulationNodeData>[]; edges: Edge[] } | null>(null);
  const undoRedoRef = useRef<SimpleUndoRedo>(new SimpleUndoRedo());
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

  
  // Save current state to history - using simple undo/redo system
  const saveToHistory = useCallback(() => {
    undoRedoRef.current.saveState(nodes, edges);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Add connection first, then save state
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          },
          eds
        )
      );
      
      setTimeout(() => {
        saveToHistory();
      }, 50);
    },
    [setEdges, saveToHistory]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      
      if (event.shiftKey && selectedNodes.length > 0) {
        // Multi-select with shift key
        const nodeId = node.id;
        setSelectedNodes(prev => {
          if (prev.includes(nodeId)) {
            return prev.filter(id => id !== nodeId);
          } else {
            return [...prev, nodeId];
          }
        });
        setSelectedNode(null);
      } else {
        // Normal single select
        setSelectedNode(node as Node<SimulationNodeData>);
        setSelectedNodes([]);
        setRightTab('config');
      }
    },
    [selectedNodes.length]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setSelectedNodes([]);
  }, []);

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
      setSelectedNode(null);
    },
    []
  );

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
      // Add component first, then save state
      setNodes((nds) => [...nds, newNode]);
      
      setTimeout(() => {
        saveToHistory();
      }, 50);
    },
    [nodes.length, setNodes, saveToHistory]
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

  const handleSelectionStart = useCallback((event: React.MouseEvent) => {
    // Only start selection with Shift key + mouse down on empty canvas
    if (!event.shiftKey) return;
    
    const target = event.target as HTMLElement;
    const isReactFlowPane = target.closest('.react-flow__pane') || 
                          target.classList.contains('react-flow__pane') ||
                          target.closest('.react-flow__renderer');
    
    // Don't start selection if clicking on nodes, handles, or other UI elements
    const isNode = target.closest('.react-flow__node') || target.classList.contains('react-flow__node');
    const isHandle = target.closest('.react-flow__handle') || target.classList.contains('react-flow__handle');
    const isControl = target.closest('.react-flow__controls') || target.classList.contains('react-flow__controls');
    const isMiniMap = target.closest('.react-flow__minimap') || target.classList.contains('react-flow__minimap');
    const isPanel = target.closest('.react-flow__panel') || target.classList.contains('react-flow__panel');
    
    if (event.button === 0 && isReactFlowPane && !isNode && !isHandle && !isControl && !isMiniMap && !isPanel) {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = event.currentTarget.getBoundingClientRect();
      const startX = event.clientX - rect.left;
      const startY = event.clientY - rect.top;
      
      setIsSelecting(true);
      setSelectionBox({
        startX,
        startY,
        endX: startX,
        endY: startY,
      });
      setSelectedNode(null);
      setSelectedNodes([]);
    }
  }, []);

  const handleSelectionMove = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionBox) return;
    
    event.preventDefault();
    
    const rect = event.currentTarget.getBoundingClientRect();
    const endX = event.clientX - rect.left;
    const endY = event.clientY - rect.top;
    
    setSelectionBox(prev => prev ? {
      ...prev,
      endX,
      endY,
    } : null);
  }, [isSelecting, selectionBox]);

  const handleSelectionEnd = useCallback((event: React.MouseEvent) => {
    if (!isSelecting || !selectionBox) {
      setIsSelecting(false);
      setSelectionBox(null);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // Calculate selection bounds in screen coordinates
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // Get the current viewport transform from ReactFlow
    const viewport = reactFlowRef.current?.getViewport();

    // Find nodes within selection bounds
    const selectedNodeIds = nodes.filter(node => {
      // Convert node position to screen coordinates
      const nodeScreenX = node.position.x * (viewport?.zoom || 1) + (viewport?.x || 0);
      const nodeScreenY = node.position.y * (viewport?.zoom || 1) + (viewport?.y || 0);
      const nodeWidth = 160 * (viewport?.zoom || 1);
      const nodeHeight = 100 * (viewport?.zoom || 1);
      
      // Check if node intersects with selection box
      const nodeLeft = nodeScreenX;
      const nodeRight = nodeScreenX + nodeWidth;
      const nodeTop = nodeScreenY;
      const nodeBottom = nodeScreenY + nodeHeight;
      
      const isSelected = nodeRight >= left && 
                        nodeLeft <= right && 
                        nodeBottom >= top && 
                        nodeTop <= bottom;
      
      
      return isSelected;
    }).map(node => node.id);

    setSelectedNodes(selectedNodeIds);
    setIsSelecting(false);
    setSelectionBox(null);
  }, [isSelecting, selectionBox, nodes]);

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
      setSelectedNodes(prev => prev.filter(id => id !== nodeId));
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

      // Save state BEFORE loading preset
      saveToHistory();

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
      setSelectedNodes([]);

      // Fit view after loading
      setTimeout(() => {
        reactFlowRef.current?.fitView({ padding: 0.2 });
      }, 100);
    },
    [setNodes, setEdges, saveToHistory]
  );

  // Undo functionality - using simple undo/redo system
  const undo = useCallback(() => {
    const prevState = undoRedoRef.current.undo();
    if (prevState) {
      // Clear all selections first
      setSelectedNode(null);
      setSelectedNodes([]);
      setSelectedEdge(null);
      
      // Restore the state directly
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
    }
  }, []);

  // Redo functionality - using simple undo/redo system
  const redo = useCallback(() => {
    const nextState = undoRedoRef.current.redo();
    if (nextState) {
      // Clear all selections first
      setSelectedNode(null);
      setSelectedNodes([]);
      setSelectedEdge(null);
      
      // Restore the state directly
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  }, []);

  // Copy functionality
  const copy = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    const selectedNodeIds = new Set(selectedNodes);
    const nodesToCopy = nodes.filter(node => selectedNodeIds.has(node.id));
    const edgesToCopy = edges.filter(edge => 
      selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );
    
    setClipboard({ nodes: nodesToCopy, edges: edgesToCopy });
  }, [selectedNodes, nodes, edges]);

  // Paste functionality
  const paste = useCallback(() => {
    if (!clipboard) return;
    
    // Create new IDs for copied nodes
    const idMap = new Map<string, string>();
    const offsetX = 50;
    const offsetY = 50;
    
    const newNodes = clipboard.nodes.map(node => {
      const newId = `node_${++nodeIdCounter}_${Date.now()}`;
      idMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
      };
    });
    
    const newEdges = clipboard.edges.map(edge => ({
      ...edge,
      id: `edge_${Date.now()}_${Math.random()}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
    }));
    
    // Save state BEFORE pasting
    saveToHistory();
    
    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
    
    // Select the newly pasted nodes
    const pastedNodeIds = newNodes.map(node => node.id);
    setSelectedNodes(pastedNodeIds);
    
  }, [clipboard, saveToHistory]);

  useKeyboardShortcuts({
    selectedNodes,
    nodes,
    clearSelectedNode: () => setSelectedNode(null),
    setSelectedNodes,
    clearSelectedEdge: () => setSelectedEdge(null),
    deleteNode,
    saveToHistory,
    undo,
    redo,
    copy,
    paste,
  });

  // Initialize history system when hydrated
  useEffect(() => {
    if (hydrated) {
      saveToHistory();
    }
  }, [hydrated, saveToHistory]);

  const selectedNodeForPanel = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode.id) || null;
  }, [selectedNode, nodes]);

  // Memoize nodes to prevent infinite re-renders
  const memoizedNodes = useMemo(() => 
    nodes.map((n) => ({
      ...n,
      data: { 
        ...n.data, 
        highlighted: n.id === highlightedNodeId,
        isMultiSelected: selectedNodes.includes(n.id)
      },
      className: [
        n.id === selectedNode?.id ? 'selected-node' : '',
        selectedNodes.includes(n.id) ? 'multi-selected-node' : ''
      ].filter(Boolean).join(' '),
      selected: selectedNodes.includes(n.id) || n.id === selectedNode?.id,
    })), 
    [nodes, highlightedNodeId, selectedNodes, selectedNode]
  );

  // Memoize edges to prevent infinite re-renders
  const memoizedEdges = useMemo(() => 
    edges.map((edge) => ({
      ...edge,
      animated: edge.id === selectedEdge?.id,
      style: {
        stroke: '#94a3b8',
        strokeWidth: edge.id === selectedEdge?.id ? 3 : 2,
      },
    })), 
    [edges, selectedEdge]
  );

  const leftPanel = useResizable(256, 180, 480, false);
  const rightPanel = useResizable(288, 220, 560, true);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-12 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-gray-900" />
            <h1 className="font-bold text-gray-800">ArchScope</h1>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {nodes.length} components
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {edges.length} connections
          </Badge>
          {selectedNodes.length > 0 && (
            <Badge variant="default" className="text-[10px] bg-blue-500">
              {selectedNodes.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/guide">
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="w-3 h-3" />
              Get Started
            </Button>
          </Link>
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
            nodes={memoizedNodes}
            edges={memoizedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            selectionKeyCode="Shift"
            deleteKeyCode={['Delete', 'Backspace']}
            multiSelectionKeyCode="Shift"
            onMouseDown={handleSelectionStart}
            onMouseMove={handleSelectionMove}
            onMouseUp={handleSelectionEnd}
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
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    💡 Tip: Hold Shift and drag on empty space to select multiple components
                  </p>
                </div>
              )}
            </Panel>
            <SelectionBox
              startX={selectionBox?.startX || 0}
              startY={selectionBox?.startY || 0}
              endX={selectionBox?.endX || 0}
              endY={selectionBox?.endY || 0}
              isActive={isSelecting && !!selectionBox}
            />
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
