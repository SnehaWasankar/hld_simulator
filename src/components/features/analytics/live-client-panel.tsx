'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { SimulationNodeData } from '@/types';
import { SCENARIOS, Scenario, LiveRequest, RequestHop, HttpMethod } from '@/data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Play,
  Square,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Trash2,
} from 'lucide-react';

interface LiveClientPanelProps {
  nodes: Node<SimulationNodeData>[];
  edges: Edge[];
  onHighlightNode: (nodeId: string | null) => void;
}

export default function LiveClientPanel({
  nodes,
  edges,
  onHighlightNode,
}: LiveClientPanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState(0);
  const [requests, setRequests] = useState<LiveRequest[]>([]);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [expandedHopIdx, setExpandedHopIdx] = useState<number | null>(null);
  const [isAutoFiring, setIsAutoFiring] = useState(false);
  const [autoFireIntervalSec, setAutoFireIntervalSec] = useState(1.5);
  const autoFireRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestCounterRef = useRef(0);

  const fireRequest = useCallback(async () => {
    if (!selectedScenario || nodes.length === 0) return;

    const endpoint = selectedScenario.endpoints[selectedEndpointIdx];
    if (!endpoint) return;

    const reqId = `req_${++requestCounterRef.current}_${Date.now()}`;
    const payloadIdx = (requestCounterRef.current - 1) % endpoint.samplePayloads.length;

    const newRequest: LiveRequest = {
      id: reqId,
      timestamp: Date.now(),
      method: endpoint.method,
      path: endpoint.path,
      payload: endpoint.samplePayloads[payloadIdx],
      status: 'in_flight',
      hops: [],
    };

    setRequests((prev) => [newRequest, ...prev].slice(0, 50));
    setExpandedRequestId(reqId);

    try {
      const graphNodes = nodes.map((n) => {
        const data = n.data as SimulationNodeData;
        return {
          id: n.id,
          label: data.label,
          componentType: data.componentType,
          serviceId: data.config.serviceId,
          cacheHitRate: data.config.cacheHitRate,
          rateLimitAlgorithm: data.config.rateLimitAlgorithm,
          rateLimitBucketSize: data.config.rateLimitBucketSize,
          rateLimitRefillRate: data.config.rateLimitRefillRate,
          rateLimitWindowSeconds: data.config.rateLimitWindowSeconds,
          rateLimitMaxRequests: data.config.rateLimitMaxRequests,
          redisCounterTtlSeconds: data.config.redisCounterTtlSeconds,
        };
      });

      const graphEdges = edges.map((e) => ({
        source: e.source,
        target: e.target,
      }));

      const startTime = Date.now();
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario.id,
          endpointIndex: selectedEndpointIdx,
          payloadIndex: payloadIdx,
          graph: { nodes: graphNodes, edges: graphEdges },
        }),
      });

      const data = await res.json();
      const actualLatency = Date.now() - startTime;

      // 429 rate-limited: has hops showing where it was blocked, treat specially
      if (res.status === 429 || data.statusCode === 429) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: 'error',
                  responseStatus: 429,
                  response: data.response?.body ?? { error: 'Too Many Requests' },
                  latencyMs: data.totalLatencyMs ?? actualLatency,
                  hops: data.hops ?? [],
                  warnings: data.warnings,
                }
              : r
          )
        );
        return;
      }

      if (!res.ok) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === reqId
              ? {
                  ...r,
                  status: 'error',
                  responseStatus: res.status,
                  response: { error: data.message || data.error || 'Request failed' },
                  latencyMs: actualLatency,
                  hops: [],
                }
              : r
          )
        );
        return;
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? {
                ...r,
                status: 'success',
                responseStatus: data.response?.status ?? 200,
                response: data.response?.body ?? data,
                latencyMs: data.totalLatencyMs ?? actualLatency,
                hops: data.hops ?? [],
                warnings: data.warnings,
              }
            : r
        )
      );
    } catch {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? { ...r, status: 'error', responseStatus: 500, latencyMs: Date.now() - newRequest.timestamp }
            : r
        )
      );
    }
  }, [selectedScenario, selectedEndpointIdx, nodes, edges]);

  const startAutoFire = useCallback(() => {
    if (autoFireRef.current) return;
    setIsAutoFiring(true);
    fireRequest();
    autoFireRef.current = setInterval(() => {
      fireRequest();
    }, Math.max(0.1, autoFireIntervalSec) * 1000);
  }, [fireRequest, autoFireIntervalSec]);

  const stopAutoFire = useCallback(() => {
    if (autoFireRef.current) {
      clearInterval(autoFireRef.current);
      autoFireRef.current = null;
    }
    setIsAutoFiring(false);
  }, []);

  const clearRequests = useCallback(() => {
    setRequests([]);
    setExpandedRequestId(null);
  }, []);

  const handleScenarioChange = useCallback((id: string | null) => {
    if (!id) return;
    const s = SCENARIOS.find((sc) => sc.id === id);
    if (s) {
      setSelectedScenario(s);
      setSelectedEndpointIdx(0);
      setRequests([]);
    }
  }, []);

  const handleEndpointChange = useCallback((val: string | null) => {
    if (val !== null) setSelectedEndpointIdx(parseInt(val as string));
  }, []);

  const endpoint = selectedScenario?.endpoints[selectedEndpointIdx];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scenario & Endpoint Selection */}
      <div className="p-3 space-y-3 border-b flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Live Client
        </h3>

        <div className="space-y-2">
          <Select onValueChange={handleScenarioChange} value={selectedScenario?.id}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select a scenario..." />
            </SelectTrigger>
            <SelectContent>
              {SCENARIOS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="text-sm">{s.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedScenario && (
            <Select onValueChange={handleEndpointChange} value={String(selectedEndpointIdx)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectedScenario.endpoints.map((ep, i) => (
                  <SelectItem key={i} value={String(i)}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ep.method === 'GET' ? 'outline' : 'default'}
                        className="text-[9px] py-0 px-1 font-mono"
                      >
                        {ep.method}
                      </Badge>
                      <span className="text-xs font-mono">{ep.path}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {endpoint && (
            <p className="text-[10px] text-gray-400">{endpoint.description}</p>
          )}
        </div>

        {/* Payload preview */}
        {endpoint && (
          <div className="bg-gray-50 rounded-md p-2">
            <div className="text-[10px] text-gray-500 mb-1 font-semibold uppercase">
              Sample Payload
            </div>
            <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap break-all max-h-20 overflow-auto">
              {JSON.stringify(endpoint.samplePayloads[0], null, 2)}
            </pre>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            onClick={fireRequest}
            disabled={!selectedScenario || nodes.length === 0}
          >
            <Send className="w-3 h-3" />
            Send Request
          </Button>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0.1}
              max={60}
              step={0.1}
              value={autoFireIntervalSec}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v >= 0.1) setAutoFireIntervalSec(v);
              }}
              disabled={isAutoFiring}
              title="Auto-fire interval (seconds)"
              className="w-14 h-8 text-xs text-center border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50"
            />
            <span className="text-[10px] text-gray-400">s</span>
          </div>
          {!isAutoFiring ? (
            <Button
              size="sm"
              variant="outline"
              onClick={startAutoFire}
              disabled={!selectedScenario || nodes.length === 0}
              title={`Auto-fire every ${autoFireIntervalSec}s`}
            >
              <Play className="w-3 h-3" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="destructive"
              onClick={stopAutoFire}
              title="Stop auto-fire"
            >
              <Square className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearRequests}
            disabled={requests.length === 0}
            title="Clear log"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Request Log */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1.5">
          {requests.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Select a scenario and send a request</p>
              <p className="mt-1 text-[10px]">Watch data flow through your architecture</p>
            </div>
          )}

          {requests.map((req) => {
            const isExpanded = expandedRequestId === req.id;
            return (
              <div key={req.id} className="border rounded-lg overflow-hidden bg-white">
                {/* Request Header */}
                <button
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedRequestId(isExpanded ? null : req.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  )}

                  <StatusIcon status={req.status} />

                  <Badge
                    variant={req.method === 'GET' ? 'outline' : 'default'}
                    className="text-[9px] py-0 px-1 font-mono flex-shrink-0"
                  >
                    {req.method}
                  </Badge>

                  <span className="text-[10px] font-mono text-gray-600 truncate flex-1">
                    {req.path}
                  </span>

                  {req.latencyMs !== undefined && (
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {req.latencyMs.toFixed(0)}ms
                    </span>
                  )}

                  {req.responseStatus && (
                    <Badge
                      variant={req.responseStatus < 400 ? 'outline' : 'destructive'}
                      className="text-[9px] py-0 px-1 flex-shrink-0"
                    >
                      {req.responseStatus}
                    </Badge>
                  )}
                </button>

                {/* Expanded: show hops */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50">
                    {/* Warnings */}
                    {req.warnings && req.warnings.length > 0 && (
                      <div className="px-3 py-2 border-b bg-amber-50">
                        <div className="text-[10px] font-semibold text-amber-700 mb-1.5 flex items-center gap-1">
                          ⚠️ ARCHITECTURE WARNINGS
                        </div>
                        <div className="space-y-1">
                          {req.warnings.map((warning, idx) => (
                            <div key={idx} className="text-[10px] text-amber-800 bg-white rounded p-2 border border-amber-200">
                              {warning}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request payload */}
                    {req.payload && (
                      <div className="px-3 py-2 border-b">
                        <div className="text-[10px] font-semibold text-blue-600 mb-1">
                          REQUEST PAYLOAD
                        </div>
                        <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap break-all max-h-24 overflow-auto bg-white rounded p-1.5 border">
                          {JSON.stringify(req.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Hops */}
                    {req.hops.length > 0 && (
                      <div className="px-3 py-2 space-y-1">
                        <div className="text-[10px] font-semibold text-gray-500 mb-1.5">
                          DATA FLOW ({req.hops.length} hops)
                        </div>
                        {req.hops.map((hop, idx) => (
                          <HopItem
                            key={idx}
                            hop={hop}
                            index={idx}
                            isLast={idx === req.hops.length - 1}
                            isExpanded={expandedHopIdx === idx && expandedRequestId === req.id}
                            onToggle={() =>
                              setExpandedHopIdx(
                                expandedHopIdx === idx ? null : idx
                              )
                            }
                            onHover={(hovering) =>
                              onHighlightNode(hovering ? hop.nodeId : null)
                            }
                          />
                        ))}
                      </div>
                    )}

                    {/* Response */}
                    {req.response && (
                      <div className="px-3 py-2 border-t">
                        <div className="text-[10px] font-semibold text-green-600 mb-1">
                          RESPONSE
                        </div>
                        <pre className="text-[10px] font-mono text-gray-700 whitespace-pre-wrap break-all max-h-32 overflow-auto bg-white rounded p-1.5 border">
                          {JSON.stringify(req.response, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Loading */}
                    {req.status === 'in_flight' && (
                      <div className="px-3 py-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing through system...
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

function StatusIcon({ status }: { status: LiveRequest['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 text-gray-400 flex-shrink-0" />;
    case 'in_flight':
      return <Loader2 className="w-3 h-3 text-blue-500 animate-spin flex-shrink-0" />;
    case 'success':
      return <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />;
    case 'error':
      return <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />;
  }
}

const COMPONENT_HOP_COLORS: Record<string, string> = {
  client: '#6366f1',
  dns: '#8b5cf6',
  cdn: '#06b6d4',
  load_balancer: '#10b981',
  api_server: '#f59e0b',
  cache: '#ef4444',
  database: '#3b82f6',
  message_queue: '#ec4899',
  storage: '#14b8a6',
  worker: '#f97316',
  transcoder: '#a855f7',
  notification_service: '#84cc16',
};

function HopItem({
  hop,
  index,
  isLast,
  isExpanded,
  onToggle,
  onHover,
}: {
  hop: RequestHop;
  index: number;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const color = COMPONENT_HOP_COLORS[hop.componentType] || '#6366f1';

  return (
    <div
      className="relative"
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white transition-colors text-left"
        onClick={onToggle}
      >
        {/* Connector line */}
        <div className="flex flex-col items-center w-4 flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0"
            style={{ borderColor: color, backgroundColor: isExpanded ? color : 'white' }}
          />
          {!isLast && (
            <div className="w-0.5 h-3 bg-gray-200 mt-0.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold" style={{ color }}>
              {hop.nodeLabel}
            </span>
            <span className="text-[9px] text-gray-400 font-mono">
              +{hop.latencyMs.toFixed(1)}ms
            </span>
          </div>
          <div className="text-[9px] text-gray-500 truncate">
            {hop.action}
          </div>
        </div>

        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-gray-300 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="ml-6 mr-1 mb-2 space-y-1.5">
          <div className="bg-white rounded border p-2">
            <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Input
            </div>
            <pre className="text-[9px] font-mono text-gray-600 whitespace-pre-wrap break-all max-h-20 overflow-auto">
              {JSON.stringify(hop.dataIn, null, 2)}
            </pre>
          </div>
          <div className="bg-white rounded border p-2">
            <div className="text-[9px] font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1">
              <ArrowRight className="w-2.5 h-2.5" /> Output
            </div>
            <pre className="text-[9px] font-mono text-gray-600 whitespace-pre-wrap break-all max-h-20 overflow-auto">
              {JSON.stringify(hop.dataOut, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
