'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { SimulationNodeData } from '@/types';
import { COMPONENT_COLORS } from '@/lib/services';
import { PRESETS } from '@/data';

import ComponentPalette from '@/components/features/architecture/component-palette';
import ConfigPanel from '@/components/features/simulator/config-panel';
import SimulationControls from '@/components/features/simulator/simulation-controls';
import ReportPanel from '@/components/features/analytics/report-panel';
import SelectionBox from '@/components/features/architecture/selection-box';

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
  BookOpen,
  Minus,
  Map,
} from 'lucide-react';
import { useAuth } from '@/context/auth';

import { useResizable } from './hooks/useResizable';
import { useSimulatorState } from './hooks/useSimulatorState';
import { useSimulation } from './hooks/useSimulation';
import { useSelection } from './hooks/useSelection';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useNodeEvents } from './hooks/useNodeEvents';
import { nodeTypes } from './constants';
import { getUserColor } from './utils/storage';

export default function Simulator() {
  // Local State
  const [rightTab, setRightTab] = useState('components');
  const [isMinimapCollapsed, setIsMinimapCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  // Authentication
  const { user, openAuth, logout } = useAuth();
  const color = user ? getUserColor(user.email) : null;

  // Custom Hooks - State Management
  const simulatorState = useSimulatorState();
  const {
    nodes,
    edges,
    selectedNode,
    selectedEdge,
    selectedNodes,
    simulationParams,
    reactFlowRef,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    addComponent,
    updateNode,
    deleteNode,
    setSelectedNode,
    setSelectedEdge,
    setSelectedNodes,
    setSimulationParams,
    undo,
    redo,
    copy,
    paste,
    saveToHistory,
  } = simulatorState;

  // Custom Hooks - Simulation Logic
  const simulation = useSimulation(nodes, edges, simulationParams, setNodes);
  const {
    simulationResult,
    setSimulationResult,
    isRunning,
    simProgress,
    liveTimeSeries,
    handleRunSimulation,
    stopSimulation,
    handleReset,
  } = simulation;

  // Custom Hooks - Selection & Events
  const selection = useSelection(nodes, reactFlowRef);
  const { isSelecting, selectionBox, handleSelectionStart, handleSelectionMove, handleSelectionEnd } = selection;

  const nodeEvents = useNodeEvents({
    selectedNodes,
    setSelectedNode,
    setSelectedNodes,
    setSelectedEdge,
    setRightTab,
    addComponent,
    reactFlowRef,
    setEdges,
    saveToHistory,
  });
  const { onNodeClick, onPaneClick, onEdgeClick, onConnect, onDragOver, onDrop } = nodeEvents;

  // Custom Hooks - Keyboard Shortcuts
  useKeyboardShortcuts({
    selectedNodes,
    selectedNode,
    selectedEdge,
    nodes,
    setNodes,
    setEdges,
    saveToHistory,
    undo,
    redo,
    copy,
    paste,
    setSelectedNode,
    setSelectedNodes,
    setSelectedEdge,
  });

  // Memoized Values
  const selectedNodeForPanel = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find((n) => n.id === selectedNode.id) || null;
  }, [selectedNode, nodes]);

  const memoizedNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isMultiSelected: selectedNodes.includes(n.id),
        },
        className: [
          n.id === selectedNode?.id ? 'selected-node' : '',
          selectedNodes.includes(n.id) ? 'multi-selected-node' : '',
        ]
          .filter(Boolean)
          .join(' '),
        selected: selectedNodes.includes(n.id) || n.id === selectedNode?.id,
      })),
    [nodes, selectedNodes, selectedNode]
  );

  const memoizedEdges = useMemo(
    () =>
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

  // Custom Hooks - Resizable Panels
  const leftPanel = useResizable(256, 180, 480, false);
  const rightPanel = useResizable(288, 220, 560, true);

  // Event Handlers
  const loadPreset = useCallback(
    (presetId: string | null) => {
      if (!presetId) return;
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      saveToHistory();

      simulatorState.setNodes(preset.nodes as Node<SimulationNodeData>[]);
      simulatorState.setEdges(
        preset.edges.map((e: Edge) => ({
          ...e,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }))
      );
      setSimulationParams(preset.simulationParams);
      setSimulationResult(null);
      setSelectedNode(null);
      setSelectedNodes([]);

      setTimeout(() => {
        saveToHistory();
      }, 100);

      setTimeout(() => {
        reactFlowRef.current?.fitView({ padding: 0.2 });
      }, 100);
    },
    [simulatorState, saveToHistory, setSimulationParams, setSimulationResult, setSelectedNode, setSelectedNodes, reactFlowRef]
  );

  const handleSaveDesign = useCallback(async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      openAuth();
      return;
    }

    const name = prompt('Enter design name');
    if (!name) return;

    const res = await fetch('/api/designs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        nodes,
        edges,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    alert('Design saved to DB!');
  }, [nodes, edges, openAuth]);

  // Render
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Top Bar - Navigation & Auth */}
      <div className="h-12 border-b bg-white flex items-center justify-between px-4 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-gray-900" />
            {/* make clickable logo - homepage */}
            <div className="group cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
              <h1 className="text-xl font-bold tracking-tight bg-linear-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-1">
                ArchScope
                <span className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-gray-500">
                </span>
              </h1>
            </div>
            {/* <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">ArchScope</h1> */}
          </div>
          {selectedNodes.length > 0 && (
            <Badge variant="default" className="text-[10px] bg-blue-500">
              {selectedNodes.length} selected
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Presets */}
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

          {/* Get Started */}
          <Link href="/guide">
            <Button variant="outline" size="sm" className="gap-2">
              <BookOpen className="w-3 h-3" />
              Get Started
            </Button>
          </Link>

          {/* Profile Icon - will need after login*/}
          {/* <button className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
            <User className="w-4 h-4 text-gray-700" />
          </button> */}

          {/* Login/ Sign Up Icon --> Profile*/}
          {user ? (
            <div className="relative">
              <div
                onClick={() => setOpen(!open)}
                // className="w-8 h-8 rounded-full 
                // bg-pink-500/20 text-pink-800 border border-pink-200
                // hover:bg-pink-500/10 hover:border-pink-400
                // flex items-center justify-center 
                // cursor-pointer font-semibold 
                // transition-all duration-200"
                className={`w-8 h-8 rounded-full 
                ${color?.bg} ${color?.text} border ${color?.border}
                ${color?.hover}
                flex items-center justify-center 
                cursor-pointer font-semibold 
                transition-all duration-200`}
              >
                {user.email[0].toUpperCase()}
              </div>

              {open && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-md">
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="inline-block px-3 py-1.5 text-red-700 
                    bg-red-500/10 border border-red-200
                    hover:bg-red-500/20 hover:border-red-400
                    transition-all duration-200 text-sm
                    rounded-md"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              onClick={openAuth}
              variant="outline"
              size="sm"
              className="bg-blue-500/20 text-blue-800 border border-blue-200 
              hover:bg-blue-500/10 hover:border-blue-400
              font-medium transition-all duration-200"
            >
              Login / Sign Up
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Simulation Controls */}
        <div className="border-r bg-white flex flex-col flex-shrink-0" style={{ width: leftPanel.size }}>
          <div className="p-3 overflow-y-auto flex-1">
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

        {/* Center Canvas - React Flow Diagram */}
        <div className="flex-1 relative">
          <div className="absolute top-4 right-4 z-10">
            <Button
              size="sm"
              onClick={handleSaveDesign}
              className="bg-green-500/20 text-green-700 border border-green-200 
              hover:bg-green-500/30 hover:border-green-400
              font-medium transition-all duration-200"
            >
              Save Design
            </Button>
          </div>
          {!isMinimapCollapsed && (
            <div
              onClick={() => setIsMinimapCollapsed(true)}
              className="w-4 h-4 bg-white border-2 border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
              style={{ position: 'absolute', bottom: '172px', right: '25px', zIndex: 9999 }}
              title="Collapse minimap"
            >
              <Minus className="w-2 h-2 text-gray-700" />
            </div>
          )}
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
            multiSelectionKeyCode="Shift"
            onMouseDown={handleSelectionStart}
            onMouseMove={handleSelectionMove}
            onMouseUp={(e) => handleSelectionEnd(e, setSelectedNodes)}
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
            {!isMinimapCollapsed && (
              <Panel position="bottom-right" className="!p-0">
                <MiniMap
                  nodeColor={(node) => {
                    const data = node.data as SimulationNodeData;
                    return COMPONENT_COLORS[data.componentType] || '#6366f1';
                  }}
                  className="!bg-white !border !shadow-md !rounded-lg"
                />
              </Panel>
            )}
            {isMinimapCollapsed && (
              <Panel position="bottom-right" className="!p-0">
                <button
                  onClick={() => setIsMinimapCollapsed(false)}
                  className="w-10 h-10 bg-white border border-gray-300 rounded-full shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Map className="w-5 h-5 text-gray-600" />
                </button>
              </Panel>
            )}
            <Panel position="top-left" className="flex flex-col gap-2">
              <Badge variant="outline" className="text-[10px]">
                {nodes.length} components
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {edges.length} connections
              </Badge>
            </Panel>
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

        {/* Right Sidebar - Component Palette, Config, Report */}
        <div className="border-l bg-white flex flex-col flex-shrink-0" style={{ width: rightPanel.size }}>
          <Tabs value={rightTab} onValueChange={(val) => setRightTab(val as string)} className="flex flex-col h-full">
            <TabsList className="flex-shrink-0 m-2 grid grid-cols-3 w-full">
              <TabsTrigger value="components" className="text-xs gap-1">
                <LayoutGrid className="w-3 h-3" />
                Add
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

            {/* Tab: Component Palette */}
            <TabsContent value="components"
              className="flex-1 min-h-0 m-0 bg-gray-50">
              <div className="h-full overflow-y-auto">
                <ComponentPalette onAddComponent={addComponent} />
              </div>
            </TabsContent>

            {/* Tab: Configuration Panel */}
            <TabsContent value="config" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <ConfigPanel
                  node={selectedNodeForPanel}
                  onUpdate={updateNode}
                  onDelete={deleteNode}
                />
              </ScrollArea>
            </TabsContent>

            {/* Tab: Simulation Report */}
            <TabsContent value="report" className="flex-1 overflow-hidden m-0">
              <ReportPanel result={simulationResult} liveTimeSeries={liveTimeSeries} isRunning={isRunning} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
