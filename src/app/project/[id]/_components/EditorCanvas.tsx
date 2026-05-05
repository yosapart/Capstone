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
  MarkerType,
  Connection,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BlockData, BLOCK_TYPES } from "./editorTypes";
import { AnimatedParticleEdge } from "./AnimatedEdge";

interface EditorCanvasProps {
  blocks: BlockData[];
  selectedFlowId: number | null;
  flowsEmpty: boolean;
  onNodeClick?: (nodeId: string) => void;
  isSimulating?: boolean;
  machineStates?: Record<number, any>;
  sourceProgress?: number;
  speed?: number;
  activeTestcase?: { name: string; detail?: string; type?: string } | null;
}

const getTestcaseStyle = (type?: string) => {
  switch(type) {
    case 'labor': return { 
      bg: 'bg-blue-50', border: 'border-blue-200', textTitle: 'text-blue-800', textIcon: 'text-blue-600', boxBorder: 'border-blue-200',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    };
    case 'electricity': return {
      bg: 'bg-yellow-50', border: 'border-yellow-200', textTitle: 'text-yellow-800', textIcon: 'text-yellow-600', boxBorder: 'border-yellow-200',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
    };
    case 'material': return {
      bg: 'bg-emerald-50', border: 'border-emerald-200', textTitle: 'text-emerald-800', textIcon: 'text-emerald-600', boxBorder: 'border-emerald-200',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
    };
    case 'machine': return {
      bg: 'bg-rose-50', border: 'border-rose-200', textTitle: 'text-rose-800', textIcon: 'text-rose-600', boxBorder: 'border-rose-200',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
    };
    default: return {
      bg: 'bg-slate-50', border: 'border-slate-200', textTitle: 'text-slate-800', textIcon: 'text-slate-600', boxBorder: 'border-slate-200',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    };
  }
};

const edgeTypes = {
  animatedParticle: AnimatedParticleEdge,
};

export function EditorCanvas({
  blocks, selectedFlowId, flowsEmpty, onNodeClick,
  isSimulating, machineStates, sourceProgress = 0, speed = 1, activeTestcase
}: EditorCanvasProps) {

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // ── Effect 1: NODES — update every tick (queue/status/progress UI) ──────────
  useEffect(() => {
    setNodes((currentNodes) => {
      const existingNodesMap = new Map(currentNodes.map((n) => [n.id, n]));
      return blocks.map((block, index) => {
        const bt = BLOCK_TYPES.find((b) => b.type === block.type);
        const existingNode = existingNodesMap.get(block.block_id.toString());
        const machineState = machineStates ? machineStates[block.step_order] : null;
        const isBlocked = isSimulating && machineState?.status === "blocked";

        return {
          ...existingNode,
          id: block.block_id.toString(),
          position: existingNode
            ? existingNode.position
            : { x: 50 + index * 200, y: 150 },
          data: {
            type: block.type,
            label: (
              <div className="flex flex-col w-full" style={{ minWidth: 130 }}>
                <div className="px-2 py-1 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-sm border-2 shrink-0"
                    style={{ borderColor: bt?.border || "#999", backgroundColor: `${bt?.color || "#666"}30` }}
                  />
                  <span className="text-xs font-bold text-[#34495e] break-all whitespace-normal">
                    {block.name}
                  </span>
                </div>
                {isSimulating && block.type === "process" && machineState && (
                  <div className="px-2 pb-1.5 pt-0.5 flex flex-col gap-1 text-[10px] border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Queue</span>
                      <span className="font-bold text-[#34495e]">{machineState.queue}/10</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status</span>
                      <span className={`font-semibold uppercase px-1 rounded text-[8px] ${machineState.status === "working" ? "bg-green-100 text-green-700" :
                        machineState.status === "blocked" ? "bg-red-100 text-red-600 animate-pulse" :
                          "bg-gray-100 text-gray-500"
                        }`}>
                        {machineState.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mt-0.5">
                      <div
                        className="bg-[#1594dd] h-1 rounded-full transition-all duration-75"
                        style={{ width: `${machineState.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: "white",
            border: `2px solid ${isBlocked ? "#ef4444" : (bt?.border || "#666")}`,
            borderRadius: "8px",
            minWidth: "120px",
            maxWidth: "250px",
            width: "auto",
            textAlign: "left",
            boxShadow: isBlocked ? "0 0 10px rgba(239,68,68,0.4)" : "none",
          },
        };
      });
    });
  }, [blocks, setNodes, isSimulating, machineStates]);

  // ── Effect 2: EDGES — update every tick to sync particle with progress ───────
  useEffect(() => {
    setEdges(() =>
      blocks.slice(0, -1).map((sourceBlock, index) => {
        const targetBlock = blocks[index + 1];
        const sourceId = sourceBlock.block_id.toString();
        const targetId = targetBlock.block_id.toString();

        let isActiveEdge = false;
        let edgeProgress = 0;

        if (isSimulating && machineStates) {
          if (sourceBlock.type === "start") {
            // Start → first process: active only when item is actually traveling
            isActiveEdge = sourceProgress > 0 && sourceProgress < 1;
            edgeProgress = sourceProgress;
          } else {
            const sourceState = machineStates[sourceBlock.step_order];
            if (sourceState) {
              // Active only when working (sending item). When blocked or idle, line goes gray.
              isActiveEdge = sourceState.status === "working";
              edgeProgress = sourceState.progress || 0;
            }
          }
        }

        return {
          id: `e${sourceId}-${targetId}`,
          source: sourceId,
          target: targetId,
          type: "animatedParticle",
          animated: false,
          data: { isActive: isActiveEdge, progress: edgeProgress },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: "#95a5a6",
          },
        };
      })
    );
  }, [blocks, setEdges, isSimulating, machineStates, sourceProgress, speed]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: "#1594dd", strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  if (flowsEmpty) {
    return (
      <main className="flex-1 overflow-auto bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Create a new flow using the &quot;+ New Flow&quot; button above.</p>
      </main>
    );
  }

  if (!selectedFlowId) {
    return (
      <main className="flex-1 overflow-auto bg-[#fafafa] flex items-center justify-center">
        <p className="text-gray-400 text-sm">Please select a flow.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 relative h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_event, node) => {
          if (node.data.type === "start" || node.data.type === "end") return;
          onNodeClick?.(node.id);
        }}
        fitView
        className="bg-[#fafafa]"
      >
        <Background gap={20} size={1} />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
        
        {/* Testcase Box Overlay */}
        {activeTestcase && activeTestcase.name !== "none" && (
          (() => {
            const style = getTestcaseStyle(activeTestcase.type);
            return (
              <Panel position="top-right" className={`bg-white border ${style.boxBorder} shadow-lg rounded-xl overflow-hidden min-w-[200px] m-4 animate-in fade-in slide-in-from-top-4 duration-300 z-50`}>
                <div className={`${style.bg} px-3 py-2 border-b ${style.border} flex items-center gap-2`}>
                  <span className={style.textIcon}>
                    {style.icon}
                  </span>
                  <span className={`text-[14px] font-bold ${style.textTitle} uppercase tracking-wide`}>Active Scenario</span>
                </div>
                <div className="p-3 bg-white">
                  <div className="text-[14px] font-semibold text-slate-800">{activeTestcase.name}</div>
                  {activeTestcase.detail && (
                    <div className="text-[13px] text-slate-500 mt-1">{activeTestcase.detail}</div>
                  )}
                </div>
              </Panel>
            );
          })()
        )}
      </ReactFlow>
    </main>
  );
}
