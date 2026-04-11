"use client";

import { useState } from "react";

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("กรุณากรอกชื่อ Project");
      return;
    }

    // ดึง user_id จาก localStorage
    const stored = localStorage.getItem("user");
    if (!stored) {
      alert("กรุณา Login ก่อน");
      return;
    }

    let userId: number;
    try {
      const user = JSON.parse(stored);
      userId = user.user_id;
    } catch {
      alert("ข้อมูล User ไม่ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          const fieldErrors = data.errors.fieldErrors;
          const messages = Object.values(fieldErrors).flat().join("\n");
          alert(messages);
        } else {
          alert(data.message || "เกิดข้อผิดพลาด");
        }
        return;
      }

      alert("สร้าง Project สำเร็จ 🎉");
      onCreated();
      onClose();
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-[420px] shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.2s ease" }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
            <div
              style={{
                width: 40, height: 40,
                border: "4px solid #e5e7eb",
                borderTop: "4px solid #1594dd",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p className="text-sm text-gray-500 mt-3 font-medium">กำลังสร้าง Project...</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-[#34495e] px-6 py-4">
          <h2 className="text-lg font-bold text-white">Create New Project</h2>
          <p className="text-gray-300 text-xs mt-1">กรอกข้อมูลเพื่อสร้าง Project ใหม่</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-semibold text-[#34495e] mb-1.5">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น Factory Layout A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] focus:border-transparent transition-all"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-[#34495e] mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="อธิบายรายละเอียดของ Project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white bg-[#1594dd] hover:bg-[#1277b5] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Project
          </button>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes modalIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    </div>
  );
}
