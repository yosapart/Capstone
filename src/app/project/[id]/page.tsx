"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

// Components & Types
import { Header } from "@/app/project/[id]/_components/Header";
import { BlockData } from "@/app/project/[id]/_components/editorTypes";
import { EditorToolbar } from "@/app/project/[id]/_components/EditorToolbar";
import { EditorLeftPanel } from "@/app/project/[id]/_components/EditorLeftPanel";
import { EditorRightPanel } from "@/app/project/[id]/_components/EditorRightPanel";
import { EditorCanvas } from "@/app/project/[id]/_components/EditorCanvas";
import { AddBlockModal } from "@/app/project/[id]/_components/AddBlockModal";
import { SimulateModal } from "@/app/project/[id]/_components/SimulateModal";
import { ReportModal } from "@/app/project/[id]/_components/ReportModal";
import { AutoOptimizeModal } from "@/app/project/[id]/_components/AutoOptimizeModal";

// Custom Hooks
import { useFlowApi } from "@/app/project/[id]/_components/useFlowApi";
import { useSimulation } from "@/app/project/[id]/_components/useSimulation";

/* ───── Main Page ───── */
export default function FlowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);

  const [speed, setSpeed] = useState(1);

  // Flow creation modal state
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [creatingFlow, setCreatingFlow] = useState(false);

  // Add Block modal state
  const [blockTypeToAdd, setBlockTypeToAdd] = useState<{ type: string; label: string } | null>(null);

  // Edit Block state
  const [blockToEdit, setBlockToEdit] = useState<BlockData | null>(null);

  // Simulation modal
  const [showSimulateModal, setShowSimulateModal] = useState(false);

  // Report modal
  const [showReport, setShowReport] = useState(false);

  // Auto-Optimize modal
  const [showOptimize, setShowOptimize] = useState(false);

  // Toast Alert state
  const [toastError, setToastError] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) { }
    }
  }, []);

  const showToast = (message: string) => {
    setToastError(message);
    setTimeout(() => setToastError(null), 3000);
  };

  // ═══════ Custom Hooks ═══════
  const {
    project, flows, blocks, selectedFlowId, loading,
    setSelectedFlowId,
    fetchBlocks,
    createFlow, createStartEndBlock, reorderBlocks, deleteBlock,
  } = useFlowApi(projectId, router);

  const {
    isSimulating, simulationResult, playbackState,
    startSimulation, stopSimulation,
  } = useSimulation(speed, blocks);

  // ═══════ Auto-Optimize Apply Handler ═══════
  const handleApplyOptimize = async (changes: { blockId: number; people: number }[]) => {
    // Batch update: PUT /api/blocks for each changed block
    await Promise.all(
      changes.map((c) =>
        fetch("/api/blocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ block_id: c.blockId, people: c.people }),
        })
      )
    );
    fetchBlocks(); // refresh canvas
  };

  // ═══════ UI Handlers ═══════

  const handleCreateFlowSubmit = async () => {
    if (!newFlowName.trim()) return;
    setCreatingFlow(true);
    const success = await createFlow(newFlowName);
    if (success) {
      setShowCreateFlow(false);
      setNewFlowName("");
    }
    setCreatingFlow(false);
  };

  const handleAddBlockClick = async (type: string, label: string) => {
    if (!selectedFlowId) {
      showToast("Please create a flow first.");
      return;
    }

    if (type === "start" && blocks.some(b => b.type === "start")) {
      showToast("This flow already contains a Start block (only one is allowed).");
      return;
    }

    if (type === "end" && blocks.some(b => b.type === "end")) {
      showToast("This flow already contains an End block (only one is allowed).)");
      return;
    }

    // สำหรับ start และ end ให้ส่งไปสร้างเลยโดยไม่ต้องเปิด Modal ถามผู้ใช้
    if (type === "start" || type === "end") {
      await createStartEndBlock(type, label);
      return;
    }

    // สำหรับประเภทอื่นๆ (เช่น process) ค่อยเปิด Modal ถามรายละเอียด
    setBlockTypeToAdd({ type, label });
  };

  // Node click handler for Editing
  const handleNodeClick = (nodeId: string) => {
    const block = blocks.find((b) => b.block_id === Number(nodeId));
    if (block) {
      setBlockToEdit(block);
    }
  };

  // Direct Delete Block from Panel
  const handleDeleteBlock = async (blockId: number) => {
    const success = await deleteBlock(blockId);
    if (success && blockToEdit?.block_id === blockId) {
      setBlockToEdit(null); // Close modal if deleting the currently editing block
    }
  };

  const handlePlayClick = () => {
    if (blocks.length < 2) {
      showToast("Unable to simulate: A Start block and an End block are required.");
      return;
    }
    if (blocks[0].type !== "start") {
      showToast("Unable to simulate: The first block must always be 'Start'.");
      return;
    }
    if (blocks[blocks.length - 1].type !== "end") {
      showToast("Unable to simulate: The final block must always be 'End'.");
      return;
    }
    setShowSimulateModal(true);
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ═══════ HEADER ═══════ */}
      <Header 
        user={user} 
        projectName={project?.name} 
      />

      {/* ═══════ TOOLBAR ═══════ */}
      <EditorToolbar
        flows={flows}
        selectedFlowId={selectedFlowId}
        setSelectedFlowId={setSelectedFlowId}
        onNewFlow={() => setShowCreateFlow(true)}
        onPlay={handlePlayClick}
        onStop={stopSimulation}
        speed={speed}
        setSpeed={setSpeed}
        onAutoOptimize={() => {
          if (!selectedFlowId) {
            showToast("Please select a flow before using the Optimize feature.");
            return;
          }
          setShowOptimize(true);
        }}
        onDownloadPDF={() => {
          if (!simulationResult) {
            showToast("You must run a simulation before generating a PDF report.");
            return;
          }
          setShowReport(true);
        }}
      />

      {/* ═══════ BODY ═══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── LEFT PANEL ─── */}
        <EditorLeftPanel onAddBlock={handleAddBlockClick} />

        {/* ─── CENTER: REACT FLOW CANVAS ─── */}
        <EditorCanvas
          blocks={blocks}
          selectedFlowId={selectedFlowId}
          flowsEmpty={flows.length === 0}
          onNodeClick={handleNodeClick}
          isSimulating={isSimulating}
          machineStates={playbackState?.machineStates}
          sourceProgress={playbackState?.sourceProgress ?? 0}
          speed={speed}
          activeTestcase={simulationResult?.testcase ? {
            name: simulationResult.testcase,
            detail: simulationResult.testcase_detail,
            type: simulationResult.testcase_type
          } : null}
        />

        {/* ─── RIGHT PANEL ─── */}
        <EditorRightPanel
          blocks={blocks}
          onDeleteBlock={handleDeleteBlock}
          onEditBlock={(blockId) => handleNodeClick(blockId.toString())}
          onReorderBlocks={reorderBlocks}
          simulationResult={simulationResult}
          playbackState={playbackState}
        />
      </div>

      {/* ═══════ CREATE FLOW MODAL ═══════ */}
      {showCreateFlow && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-[2000] p-4" onClick={() => setShowCreateFlow(false)}>
          <div
            className="bg-white rounded-[24px] w-full max-w-[400px] shadow-[0_20px_60px_rgba(0,0,0,0.06)] border border-[#e8e8e3] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {creatingFlow && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 rounded-full border-[3px] border-gray-100 border-t-[#4CAF50] animate-spin" />
              </div>
            )}

            <div className="p-8 pb-6">
              <h2 className="text-[22px] font-semibold text-[#2b3a2f] tracking-tight mb-2">Create New Flow</h2>
              <p className="text-[14px] text-gray-400 mb-8 leading-relaxed">
                Give your new factory simulation flow a descriptive name.
              </p>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#7A8B76]">
                  Flow Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Main Factory Flow"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full bg-[#fbfbf9] border border-[#e8e8e3] rounded-[14px] px-4 py-3.5 text-[15px] font-medium text-[#2b3a2f] placeholder-gray-300 outline-none hover:border-[#d0d0c8] focus:bg-white focus:border-[#8F9E8B] focus:ring-[3px] focus:ring-[#8F9E8B]/10 transition-all"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFlowSubmit();
                  }}
                />
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowCreateFlow(false)}
                  className="flex-1 py-3 text-[15px] font-semibold text-gray-600 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-[14px] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFlowSubmit}
                  disabled={!newFlowName.trim()}
                  className="flex-1 py-3 text-[15px] font-bold text-white bg-[#4CAF50] hover:bg-[#388E3C] rounded-[14px] shadow-[0_4px_16px_rgba(76,175,80,0.3)] hover:shadow-[0_6px_20px_rgba(76,175,80,0.4)] hover:-translate-y-[1px] active:translate-y-0 transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  Create Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ADD BLOCK MODAL ═══════ */}
      {blockTypeToAdd && selectedFlowId && (
        <AddBlockModal
          flowId={selectedFlowId}
          stepOrder={blocks.length + 1}
          blockType={blockTypeToAdd}
          onClose={() => setBlockTypeToAdd(null)}
          onSuccess={() => {
            fetchBlocks();
          }}
        />
      )}

      {/* ═══════ EDIT BLOCK MODAL ═══════ */}
      {blockToEdit && selectedFlowId && (
        <AddBlockModal
          flowId={selectedFlowId}
          stepOrder={blockToEdit.step_order}
          blockType={{ type: blockToEdit.type, label: blockToEdit.type === "start" ? "Start" : blockToEdit.type === "end" ? "End" : "Process" }}
          existingBlock={blockToEdit}
          onClose={() => setBlockToEdit(null)}
          onSuccess={() => {
            fetchBlocks();
          }}
        />
      )}

      {/* ═══════ SIMULATE MODAL ═══════ */}
      {showSimulateModal && selectedFlowId && (
        <SimulateModal
          flowId={selectedFlowId}
          flowName={flows.find((f) => f.flow_id === selectedFlowId)?.name || ""}
          onClose={() => setShowSimulateModal(false)}
          onResult={(result) => {
            startSimulation(result);
          }}
        />
      )}

      {/* ═══════ REPORT MODAL ═══════ */}
      {showReport && simulationResult && project && selectedFlowId && (
        <ReportModal
          projectName={project.name}
          flowName={flows.find((f) => f.flow_id === selectedFlowId)?.name || "Unknown Flow"}
          simulationResult={simulationResult}
          authorName={(() => {
            if (typeof window !== "undefined") {
              try {
                const u = JSON.parse(sessionStorage.getItem("user") || "{}");
                return u?.name || "Unknown User";
              } catch {
                return "Unknown User";
              }
            }
            return "Unknown User";
          })()}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* ═══════ MINIMAL TOAST ALERT ═══════ */}
      {toastError && (
        <div className="fixed bottom-25 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#1e293b] text-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-800 rounded-2xl px-5 py-3.5 flex items-center gap-3.5 w-max max-w-[400px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 drop-shadow-sm"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span className="text-[14px] font-medium tracking-wide leading-relaxed">{toastError}</span>
          </div>
        </div>
      )}
      {/* ╔═══════ AUTO-OPTIMIZE MODAL ═══════ */}
      {showOptimize && (
        <AutoOptimizeModal
          blocks={blocks}
          onClose={() => setShowOptimize(false)}
          onApply={handleApplyOptimize}
        />
      )}

    </div>
  );
}
