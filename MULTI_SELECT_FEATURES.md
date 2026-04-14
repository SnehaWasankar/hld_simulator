# Multi-Selection and Group Movement Features

This document describes the multi-selection functionality added to ArchScope for selecting and moving multiple components simultaneously.

## Features Implemented

### 1. Selection Box (Shift + Click and Drag)
- **How to use**: Hold Shift key and click+drag on empty canvas space to create a selection box
- **Behavior**: All components within the box are selected
- **Visual feedback**: Blue selection box appears while dragging

### 2. Multi-Select with Shift Key
- **How to use**: Hold Shift and click on components to add/remove them from selection
- **Behavior**: Toggle individual components in the selection
- **Visual feedback**: Selected components show blue ring and animated border

### 3. Keyboard Shortcuts
- **Escape**: Clear all selections
- **Delete/Backspace**: Delete all selected components
- **Ctrl/Cmd + A**: Select all components
- **Ctrl/Cmd + Z**: Undo last action
- **Ctrl/Cmd + Shift + Z**: Redo last undone action
- **Ctrl/Cmd + Y**: Redo (alternative)
- **Ctrl/Cmd + C**: Copy selected components
- **Ctrl/Cmd + V**: Paste copied components
- **Ctrl/Cmd + X**: Cut selected components (copy + delete) in the canvas

### 4. Undo/Redo System
- **How to use**: Ctrl/Cmd + Z to undo, Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y to redo
- **Behavior**: Maintains up to 50 history states of your architecture
- **Features**: 
  - Automatic history saving on all actions (add, delete, connect, move, paste)
  - Smart history management (removes redo states when new action is performed)
  - Preserves component configurations and connections
- **Visual feedback**: History state changes in the background

### 5. Copy/Paste Functionality
- **How to use**: Select components, Ctrl/Cmd + C to copy, Ctrl/Cmd + V to paste
- **Behavior**: Creates duplicate components with new unique IDs
- **Features**:
  - Copies selected components and their internal connections
  - Pastes components with offset (50px right, 50px down) to avoid overlap
  - Automatically selects newly pasted components for easy repositioning
  - Maintains all component configurations and settings
- **Cut functionality**: Ctrl/Cmd + X copies selected components then deletes them

### 6. Group Movement
- **How to use**: Select multiple components and drag any one of them
- **Behavior**: All selected components move together as a group
- **Implementation**: Uses ReactFlow's built-in multi-select drag functionality

### 7. Visual Indicators
- **Selected components**: Blue ring around component with animated dashed border
- **Selection count**: Badge in top bar shows number of selected components
- **Selection box**: Semi-transparent blue box during selection

## Technical Implementation

### Components Added/Modified

1. **SelectionBox Component** (`/src/components/selection-box.tsx`)
   - Renders the visual selection box during drag operations
   - Positioned absolutely over the canvas

2. **Simulator Component** (`/src/components/simulator.tsx`)
   - Added selection state management
   - Implemented mouse event handlers for selection box
   - Added keyboard shortcuts
   - Updated node rendering to show selection state

3. **InfraNode Component** (`/src/components/infra-node.tsx`)
   - Added visual styling for multi-selected nodes
   - Blue ring indicator for selected components

### State Management

```typescript
const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
const [isSelecting, setIsSelecting] = useState(false);
const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
```

### Event Handlers

- `handleSelectionStart`: Initiates selection box on mouse down
- `handleSelectionMove`: Updates selection box dimensions during drag
- `handleSelectionEnd`: Finalizes selection and finds nodes within bounds
- Keyboard event listeners for shortcuts

### Integration with ReactFlow

- Uses ReactFlow's built-in `selected` property for nodes
- Leverages existing drag functionality for group movement
- Maintains compatibility with existing single-select behavior

## User Experience

### Workflow Examples

1. **Selecting Multiple Components**:
   - Click and drag to create selection box around components
   - OR hold Shift and click individual components
   - Selected components show blue rings

2. **Moving Components as Group**:
   - Select multiple components using any method
   - Click and drag any selected component
   - All selected components move together

3. **Deleting Multiple Components**:
   - Select components to delete
   - Press Delete or Backspace key
   - All selected components are removed

4. **Clearing Selection**:
   - Press Escape key
   - OR click on empty canvas space
   - OR click on a single component (switches to single-select)

### Visual Feedback

- **Selection Box**: Semi-transparent blue overlay during drag selection
- **Selected Nodes**: Blue ring with animated dashed border
- **Selection Counter**: Badge shows count in top bar
- **Hover States**: Consistent with existing component interactions

## Browser Compatibility

- Works in all modern browsers
- Uses standard mouse events and React event system
- No additional dependencies required

## Performance Considerations

- Selection bounds calculation uses simple position comparison
- Event handlers are properly cleaned up
- State updates are batched to prevent unnecessary re-renders
- Uses React.memo for InfraNode component optimization

## Future Enhancements

Potential improvements for future versions:

1. **Lasso Selection**: Free-form selection tool
2. **Selection Persistence**: Save/load selection state
3. **Bulk Operations**: Apply configuration changes to multiple components
4. **Alignment Tools**: Snap-to-grid and alignment helpers
5. **Copy/Paste**: Duplicate selected components

## Testing

To test the multi-selection functionality:

1. Open the application in browser
2. Add several components to the canvas
3. Try click-and-drag selection on empty space
4. Test Shift+click for multi-select
5. Verify group movement works
6. Test keyboard shortcuts (Esc, Delete, Ctrl+A)
7. Check selection count badge updates correctly
