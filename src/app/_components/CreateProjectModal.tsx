"use client";

import { useState } from "react";

interface CreateProjectModalProps {
  existingProject?: any;
  onClose: () => void;
  onCreated: (projectId: number) => void;
  onUpdated?: () => void;
}

export function CreateProjectModal({ 
  existingProject, 
  onClose, 
  onCreated, 
  onUpdated 
}: CreateProjectModalProps) {
  const isEditMode = !!existingProject;
  const [name, setName] = useState(existingProject?.name || "");
  const [description, setDescription] = useState(existingProject?.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("กรุณากรอกชื่อ Project");
      return;
    }

    // ดึง user_id จาก localStorage
    const stored = sessionStorage.getItem("user");
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
      let res;
      if (isEditMode) {
        res = await fetch("/api/projects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: existingProject.project_id,
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        });
      } else {
        res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        });
      }

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

      if (isEditMode) {
        onUpdated?.();
      } else {
        onCreated(data.project.project_id);
      }
      onClose();
    } catch {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };


  const inputClassName = "w-full bg-[#fbfbf9] border border-[#e8e8e3] rounded-xl px-4 py-2.5 text-[15px] text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#8F9E8B]/15 focus:border-[#8F9E8B] transition-all duration-300";
  const labelClassName = "block text-[13px] font-medium text-gray-500 mb-1.5";
  const isFormIncomplete = !name.trim();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[2000]" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-[500px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#8F9E8B] animate-spin" />
            <p className="text-sm text-gray-500 mt-3 font-medium">กำลังดำเนินการ...</p>
          </div>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-2 shrink-0">
          <h2 className="text-[22px] font-medium text-gray-800 tracking-tight">
            {isEditMode ? "Edit Project" : "Create New Project"}
          </h2>
          <p className="text-[14px] text-gray-400 mt-1 font-light">
            {isEditMode ? "แก้ไขข้อมูลโปรเจกต์ของคุณ" : "กรอกข้อมูลเพื่อสร้าง Project ใหม่"}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 overflow-y-auto">
          {/* Project Name */}
          <div>
            <label className={labelClassName}>
              Project Name <span className="text-[#d97777]">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น Factory Layout A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClassName}>
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              placeholder="อธิบายรายละเอียดของ Project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-end shrink-0 bg-white border-t border-[#f4f4f4] gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || isFormIncomplete}
            className={`px-7 py-2.5 text-[14px] font-semibold text-white rounded-xl transition-all ${
              loading || isFormIncomplete
                ? "bg-gray-300 cursor-not-allowed opacity-70"
                : "bg-[#4CAF50] hover:bg-[#43A047] shadow-[0_4px_12px_rgba(76,175,80,0.3)]"
            }`}
          >
            {isEditMode ? "Save Changes" : "Create Project"}
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
