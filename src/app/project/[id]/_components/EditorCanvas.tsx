"use client";

import { useEffect, useCallback } from "react";
import { 
  ReactFlow, 
  Controls, 
  Background, 
  MiniMap, 
  Node, 
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BlockData, BLOCK_TYPES } from "./editorTypes";

interface EditorCanvasProps {
  blocks: BlockData[];
  selectedFlowId: number | null;
  flowsEmpty: boolean;
}

export function EditorCanvas({ blocks, selectedFlowId, flowsEmpty }: EditorCanvasProps) {
  
  // Use React Flow state hooks for interactivity
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Update nodes and default edges when blocks change (fetched from API)
  useEffect(() => {
    // Preserve existing positions if node already exists on canvas
    setNodes((currentNodes) => {
      const existingNodesMap = new Map(currentNodes.map((n) => [n.id, n]));
      
      return blocks.map((block, index) => {
        const bt = BLOCK_TYPES.find((b) => b.type === block.type);
        const existingNode = existingNodesMap.get(block.block_id.toString());
        
        return {
          id: block.block_id.toString(),
          position: existingNode 
            ? existingNode.position 
            : { x: 50 + index * 200, y: 150 }, // Default position
          data: { 
            label: (
              <div className="px-2 py-1 flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm border-2" 
                  style={{ borderColor: bt?.border || "#999", backgroundColor: `${bt?.color || "#666"}30` }}
                />
                <span className="text-xs font-bold text-[#34495e]">{block.name}</span>
              </div>
            )
          },
          style: {
            background: "white",
            border: `2px solid ${bt?.border || "#666"}`,
            borderRadius: "8px",
            minWidth: "120px",
            textAlign: "left",
          }
        };
      });
    });

    // Force edges to always match the sequential step_order logic
    setEdges(() => {
      return blocks.slice(0, -1).map((block, index) => {
        const nextBlock = blocks[index + 1];
        return {
          id: `e${block.block_id}-${nextBlock.block_id}`,
          source: block.block_id.toString(),
          target: nextBlock.block_id.toString(),
          type: "smoothstep",
          animated: true,
          style: { stroke: "#1594dd", strokeWidth: 2.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: "#1594dd",
          },
        };
      });
    });
  }, [blocks, setNodes, setEdges]);

  // Handle user connecting two nodes manualy
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#1594dd", strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  if (flowsEmpty) {
    return (
      <main className="flex-1 overflow-auto bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400 text-sm">สร้าง Flow ใหม่ด้วยปุ่ม "+ New Flow" ด้านบน</p>
      </main>
    );
  }

  if (!selectedFlowId) {
    return (
      <main className="flex-1 overflow-auto bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400 text-sm">กรุณาเลือก Flow</p>
      </main>
    );
  }

  return (
    <main className="flex-1 relative h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-[#fafafa]"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </main>
  );
}
