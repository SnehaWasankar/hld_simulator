import { useState, useCallback } from 'react';
import { Node, ReactFlowInstance } from '@xyflow/react';
import { SimulationNodeData } from '@/types';

export function useSelection(
  nodes: Node<SimulationNodeData>[],
  reactFlowRef: React.MutableRefObject<ReactFlowInstance<Node<SimulationNodeData>, any> | null>
) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const handleSelectionStart = useCallback(
    (event: React.MouseEvent) => {
      if (!event.shiftKey) return;

      const target = event.target as HTMLElement;
      const isReactFlowPane =
        target.closest('.react-flow__pane') ||
        target.classList.contains('react-flow__pane') ||
        target.closest('.react-flow__renderer');

      const isNode =
        target.closest('.react-flow__node') || target.classList.contains('react-flow__node');
      const isHandle =
        target.closest('.react-flow__handle') || target.classList.contains('react-flow__handle');
      const isControl =
        target.closest('.react-flow__controls') || target.classList.contains('react-flow__controls');
      const isMiniMap =
        target.closest('.react-flow__minimap') || target.classList.contains('react-flow__minimap');
      const isPanel =
        target.closest('.react-flow__panel') || target.classList.contains('react-flow__panel');

      if (
        event.button === 0 &&
        isReactFlowPane &&
        !isNode &&
        !isHandle &&
        !isControl &&
        !isMiniMap &&
        !isPanel
      ) {
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
      }
    },
    []
  );

  const handleSelectionMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isSelecting || !selectionBox) return;

      event.preventDefault();

      const rect = event.currentTarget.getBoundingClientRect();
      const endX = event.clientX - rect.left;
      const endY = event.clientY - rect.top;

      setSelectionBox((prev) =>
        prev
          ? {
              ...prev,
              endX,
              endY,
            }
          : null
      );
    },
    [isSelecting, selectionBox]
  );

  const handleSelectionEnd = useCallback(
    (event: React.MouseEvent, setSelectedNodes: (ids: string[]) => void) => {
      if (!isSelecting || !selectionBox) {
        setIsSelecting(false);
        setSelectionBox(null);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const left = Math.min(selectionBox.startX, selectionBox.endX);
      const top = Math.min(selectionBox.startY, selectionBox.endY);
      const right = Math.max(selectionBox.startX, selectionBox.endX);
      const bottom = Math.max(selectionBox.startY, selectionBox.endY);

      const viewport = reactFlowRef.current?.getViewport();

      const selectedNodeIds = nodes
        .filter((node) => {
          const nodeScreenX = node.position.x * (viewport?.zoom || 1) + (viewport?.x || 0);
          const nodeScreenY = node.position.y * (viewport?.zoom || 1) + (viewport?.y || 0);
          const nodeWidth = 160 * (viewport?.zoom || 1);
          const nodeHeight = 100 * (viewport?.zoom || 1);

          const nodeLeft = nodeScreenX;
          const nodeRight = nodeScreenX + nodeWidth;
          const nodeTop = nodeScreenY;
          const nodeBottom = nodeScreenY + nodeHeight;

          const isSelected =
            nodeRight >= left && nodeLeft <= right && nodeBottom >= top && nodeTop <= bottom;

          return isSelected;
        })
        .map((node) => node.id);

      setSelectedNodes(selectedNodeIds);
      setIsSelecting(false);
      setSelectionBox(null);
    },
    [isSelecting, selectionBox, nodes, reactFlowRef]
  );

  return {
    isSelecting,
    selectionBox,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
  };
}
