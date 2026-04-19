import { useEffect } from "react";

interface KeyboardShortcutParams {
  selectedNodes: string[];
  nodes: Array<{ id: string }>;
  clearSelectedNode: () => void;
  setSelectedNodes: (ids: string[]) => void;
  clearSelectedEdge: () => void;
  deleteNode: (nodeId: string) => void;
  saveToHistory: () => void;
  undo: () => void;
  redo: () => void;
  copy: () => void;
  paste: () => void;
}

export function useKeyboardShortcuts({
  selectedNodes,
  nodes,
  clearSelectedNode,
  setSelectedNodes,
  clearSelectedEdge,
  deleteNode,
  saveToHistory,
  undo,
  redo,
  copy,
  paste,
}: KeyboardShortcutParams) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelectedNode();
        setSelectedNodes([]);
        clearSelectedEdge();
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selectedNodes.length > 0) {
        event.preventDefault();
        selectedNodes.forEach((nodeId) => deleteNode(nodeId));
        setSelectedNodes([]);
        setTimeout(() => saveToHistory(), 100);
        return;
      }

      if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setSelectedNodes(nodes.map((n) => n.id));
        clearSelectedNode();
        return;
      }

      if (event.key === "z" && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }

      if (event.key === "z" && (event.ctrlKey || event.metaKey) && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "y" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "c" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        copy();
        return;
      }

      if (event.key === "v" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        paste();
        return;
      }

      if (event.key === "x" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (selectedNodes.length > 0) {
          copy();
          saveToHistory();
          selectedNodes.forEach((nodeId) => deleteNode(nodeId));
          setSelectedNodes([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedNodes,
    nodes,
    clearSelectedNode,
    setSelectedNodes,
    clearSelectedEdge,
    deleteNode,
    saveToHistory,
    undo,
    redo,
    copy,
    paste,
  ]);
}
