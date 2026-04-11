"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

// Components & Types
import { FlowData, BlockData, ProjectData } from "./_components/editorTypes";
import { EditorToolbar } from "./_components/EditorToolbar";
import { EditorLeftPanel } from "./_components/EditorLeftPanel";
import { EditorRightPanel } from "./_components/EditorRightPanel";
import { EditorCanvas } from "./_components/EditorCanvas";
import { AddBlockModal } from "./_components/AddBlockModal";

/* ───── Main Page ───── */
export default function FlowEditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = Number(params.id);

  const [project, setProject] = useState<ProjectData | null>(null);
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);

  // Flow creation modal state
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [newFlowName, setNewFlowName] = useState("");
  const [creatingFlow, setCreatingFlow] = useState(false);

  // Add Block modal state
  const [blockTypeToAdd, setBlockTypeToAdd] = useState<{ type: string; label: string } | null>(null);
  
  // Edit Block state
  const [blockToEdit, setBlockToEdit] = useState<BlockData | null>(null);

  // Fetch project info
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data: ProjectData[] = await res.json();
          const p = data.find((x) => x.project_id === projectId);
          if (p) setProject(p);
          else router.push("/home");
        }
      } catch {
        router.push("/home");
      }
    };
    if (projectId) fetchProject();
  }, [projectId, router]);

  // Fetch flows for this project
  const fetchFlows = useCallback(async (autoSelectNewest = false) => {
    try {
      const res = await fetch("/api/flows");
      if (res.ok) {
        const data: FlowData[] = await res.json();
        const projectFlows = data.filter((f) => f.project_id === projectId);
        setFlows(projectFlows);
        
        if (projectFlows.length > 0) {
          if (autoSelectNewest) {
             // Select the last created one
             setSelectedFlowId(projectFlows[projectFlows.length - 1].flow_id);
          } else if (!selectedFlowId) {
             setSelectedFlowId(projectFlows[0].flow_id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch flows:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedFlowId]);

  useEffect(() => {
    if (projectId) fetchFlows();
  }, [projectId]);

  // Fetch blocks for selected flow
  const fetchBlocks = useCallback(async () => {
    if (!selectedFlowId) {
      setBlocks([]);
      return;
    }
    try {
      const res = await fetch(`/api/blocks?flow_id=${selectedFlowId}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data: BlockData[] = await res.json();
        setBlocks(data);
      }
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    }
  }, [selectedFlowId]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // Create new flow API Call
  const handleCreateFlowSubmit = async () => {
    if (!newFlowName.trim()) return;

    setCreatingFlow(true);
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, name: newFlowName.trim() }),
      });

      if (res.ok) {
        setShowCreateFlow(false);
        setNewFlowName("");
        await fetchFlows(true); // Refetch and auto-select newest
      } else {
        const data = await res.json();
        alert(data.message || "สร้าง Flow ไม่สำเร็จ");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setCreatingFlow(false);
    }
  };

  // Add block: Open Modal or direct post
  const handleAddBlockClick = async (type: string, label: string) => {
    if (!selectedFlowId) {
      alert("กรุณาสร้าง Flow ก่อน");
      return;
    }

    if (type === "start" && blocks.some(b => b.type === "start")) {
      alert("ไม่สามารถเพิ่มได้: Flow นี้มี Start Block อยู่แล้ว (อนุญาตให้มีได้แค่ 1 อัน)");
      return;
    }

    if (type === "end" && blocks.some(b => b.type === "end")) {
      alert("ไม่สามารถเพิ่มได้: Flow นี้มี End Block อยู่แล้ว (อนุญาตให้มีได้แค่ 1 อัน)");
      return;
    }

    // สำหรับ start และ end ให้ส่งไปสร้างเลยโดยไม่ต้องเปิด Modal ถามผู้ใช้
    if (type === "start" || type === "end") {
      try {
        const res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flow_id: selectedFlowId,
            step_order: blocks.length + 1,
            type,
            name: label, // ใช้ชื่อ 'Start' หรือ 'End' แบบสำเร็จรูป
          }),
        });
        
        if (res.ok) {
          fetchBlocks();
        } else {
          alert("สร้าง Block ไม่สำเร็จ");
        }
      } catch (err) {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      }
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

  // Reorder Blocks Drag & Drop
  const handleReorderBlocks = async (newBlocks: BlockData[]) => {
    // Optimistic UI updates
    setBlocks(newBlocks);
    
    const payload = newBlocks.map(b => ({
      block_id: b.block_id,
      step_order: b.step_order
    }));

    try {
      const res = await fetch("/api/blocks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        alert("จัดลำดับใหม่ไม่สำเร็จ ระบบจะรีโหลดข้อมูลเดิม");
        fetchBlocks(); // rollback UI
      }
    } catch (error) {
      alert("เชื่อมต่อไม่สำเร็จ เพื่อเซิร์ฟเวอร์ ระบบจะรีโหลดข้อมูลเดิม");
      fetchBlocks(); // rollback UI
    }
  };

  // Direct Delete Block from Panel
  const handleDeleteBlock = async (blockId: number) => {
    // ถอด confirm ออกชั่วคราวเผื่อ Browser บล็อค popup
    try {
      const res = await fetch(`/api/blocks?block_id=${blockId}`, { method: "DELETE" });
      if (res.ok) {
        fetchBlocks();
        if (blockToEdit?.block_id === blockId) {
          setBlockToEdit(null); // Close modal if deleting the currently editing block
        }
        alert("ลบ Block สำเร็จแล้วครับ!");
      } else {
        const data = await res.json();
        alert(data.message || "ลบ Block ไม่สำเร็จ");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <p className="text-gray-400">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="flex items-center h-[50px] bg-[#34495e] px-4 shrink-0 z-50 shadow-md gap-4">
        {/* Menu + Logo */}
        <Link href="/home" className="shrink-0 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          <Image src="/FacSimLogo.png" alt="FacSim Logo" width={100} height={12} priority />
        </Link>
        <span className="text-white font-semibold text-sm">{project.name}</span>
        <div className="flex-1" />
        <div className="w-7 h-7 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-xs uppercase">
          U
        </div>
      </header>

      {/* ═══════ TOOLBAR ═══════ */}
      <EditorToolbar
        flows={flows}
        selectedFlowId={selectedFlowId}
        setSelectedFlowId={setSelectedFlowId}
        onNewFlow={() => setShowCreateFlow(true)}
        speed={speed}
        setSpeed={setSpeed}
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
        />

        {/* ─── RIGHT PANEL ─── */}
        <EditorRightPanel 
          blocks={blocks} 
          onDeleteBlock={handleDeleteBlock} 
          onEditBlock={(blockId) => handleNodeClick(blockId.toString())}
          onReorderBlocks={handleReorderBlocks}
        />
      </div>

      {/* ═══════ CREATE FLOW MODAL ═══════ */}
      {showCreateFlow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={() => setShowCreateFlow(false)}>
          <div
            className="bg-white rounded-2xl w-[360px] shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "modalIn 0.2s ease" }}
          >
            {creatingFlow && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#1594dd] animate-spin" />
              </div>
            )}
            <div className="bg-[#34495e] px-5 py-4">
              <h2 className="text-base font-bold text-white">Create New Flow</h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-semibold text-[#34495e] mb-1.5">
                Flow Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="เช่น Main Factory Flow"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFlowSubmit();
                }}
              />
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setShowCreateFlow(false)}
                className="flex-1 py-2 text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlowSubmit}
                disabled={!newFlowName.trim()}
                className="flex-1 py-2 text-sm font-bold text-white bg-[#1594dd] hover:bg-[#1277b5] rounded-lg transition-all disabled:opacity-50"
              >
                Create
              </button>
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
    </div>
  );
}
