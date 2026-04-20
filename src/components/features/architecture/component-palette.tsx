'use client';

import React from 'react';
import {
  Server,
  Database,
  Layers,
  MonitorPlay,
  Bell,
  Cpu,
  Network,
  MailCheck,
  ShieldAlert,
} from 'lucide-react';
import { ComponentType } from '@/types';
import { COMPONENT_COLORS, COMPONENT_LABELS } from '@/lib/services';
import { ScrollArea } from '@/components/ui/scroll-area';

const ICONS: Record<ComponentType, React.ElementType> = {
  client: MonitorPlay,
  load_balancer: Network,
  api_server: Server,
  cache: Layers,
  database: Database,
  message_queue: MailCheck,
  worker: Cpu,
  notification_service: Bell,
  rate_limiter: ShieldAlert,
};

const COMPONENT_TYPES: ComponentType[] = [
  'client',
  'load_balancer',
  'rate_limiter',
  'api_server',
  'cache',
  'database',
  'message_queue',
  'worker',
  'notification_service',
];

interface ComponentPaletteProps {
  onAddComponent: (type: ComponentType) => void;
}

export default function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const onDragStart = (event: React.DragEvent, type: ComponentType) => {
    event.dataTransfer.setData('application/reactflow-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-full">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
        Components
      </h3>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="grid grid-cols-2 gap-2 pr-2">
          {COMPONENT_TYPES.map((type) => {
            const Icon = ICONS[type];
            const color = COMPONENT_COLORS[type];
            return (
              <button
                key={type}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
                draggable
                onDragStart={(e) => onDragStart(e, type)}
                onClick={() => onAddComponent(type)}
                title={`Add ${COMPONENT_LABELS[type]}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-[10px] font-medium text-gray-600 text-center leading-tight">
                  {COMPONENT_LABELS[type]}
                </span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
