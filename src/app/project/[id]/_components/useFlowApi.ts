"use client";

import { useState, useEffect, useCallback } from "react";
import { FlowData, BlockData, ProjectData } from "./editorTypes";

/**
 * Custom hook: จัดการ Data Fetching & CRUD ทั้งหมด
 * — project, flows, blocks, selectedFlowId, loading
 * — createFlow, createStartEndBlock, reorderBlocks, deleteBlock
 */
export function useFlowApi(projectId: number, router: { push: (url: string) => void }) {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<number | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch project info ──────────────────────────────────────────────────────
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

  // ── Fetch flows for this project ────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Fetch blocks for selected flow ──────────────────────────────────────────
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
  }, [selectedFlowId, fetchBlocks]);

  // ── Create new flow ─────────────────────────────────────────────────────────
  const createFlow = async (name: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, name: name.trim() }),
      });

      if (res.ok) {
        await fetchFlows(true); // Refetch and auto-select newest
        return true;
      } else {
        const data = await res.json();
        alert(data.message || "สร้าง Flow ไม่สำเร็จ");
        return false;
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return false;
    }
  };

  // ── Create Start/End block directly (no modal) ──────────────────────────────
  const createStartEndBlock = async (type: string, label: string): Promise<boolean> => {
    if (!selectedFlowId) return false;
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
        return true;
      } else {
        alert("สร้าง Block ไม่สำเร็จ");
        return false;
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      return false;
    }
  };

  // ── Reorder blocks (Drag & Drop) ────────────────────────────────────────────
  const reorderBlocks = async (newBlocks: BlockData[]) => {
    if (!selectedFlowId) return;
    // Optimistic UI update
    setBlocks(newBlocks);

    const payload = {
      flow_id: selectedFlowId,
      items: newBlocks.map(b => ({
        block_id: b.block_id,
        step_order: b.step_order,
      })),
    };

    try {
      const res = await fetch("/api/blocks/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        alert("จัดลำดับใหม่ไม่สำเร็จ ระบบจะรีโหลดข้อมูลเดิม");
        fetchBlocks(); // rollback UI
      } else {
        fetchBlocks(); // sync after normalize
      }
    } catch {
      alert("เชื่อมต่อไม่สำเร็จ ระบบจะรีโหลดข้อมูลเดิม");
      fetchBlocks(); // rollback UI
    }
  };

  // ── Delete block ────────────────────────────────────────────────────────────
  const deleteBlock = async (blockId: number): Promise<boolean> => {
    if (!selectedFlowId) return false;
    try {
      const res = await fetch(
        `/api/blocks?block_id=${blockId}&flow_id=${selectedFlowId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        fetchBlocks();
        return true;
      } else {
        const data = await res.json();
        alert(data.message || "ลบ Block ไม่สำเร็จ");
        return false;
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
      return false;
    }
  };

  return {
    project, flows, blocks, selectedFlowId, loading,
    setSelectedFlowId,
    fetchFlows, fetchBlocks,
    createFlow, createStartEndBlock, reorderBlocks, deleteBlock,
  };
}
