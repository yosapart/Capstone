"use client";

import { useState } from "react";
const IconAlertTriangle = ({ size = 32, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

interface DeleteProjectModalProps {
  project: any;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteProjectModal({ project, onClose, onDeleted }: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects?project_id=${project.project_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onDeleted();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || "ลบไม่สำเร็จ");
      }
    } catch {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[2001]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[400px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col p-7 mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.25s cubic-bezier(0, 0, 0.2, 1)" }}
      >
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}

        <div className="mb-2">
          <h3 className="text-[19px] font-bold text-gray-900 tracking-tight">Delete Project</h3>
        </div>
        
        <div className="mb-8">
          <p className="text-[14px] text-gray-500 leading-relaxed font-light">
            คุณต้องการลบโปรเจกต์ <span className="font-medium text-gray-900">"{project.name}"</span> ใช่หรือไม่? 
            การดำเนินการนี้ไม่สามารถย้อนกลับได้และข้อมูลทั้งหมดจะถูกลบถาวร
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-[14px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2 text-[14px] font-semibold text-white bg-[#ef4444] hover:bg-[#dc2626] rounded-xl transition-all shadow-sm shadow-red-200 disabled:opacity-50"
          >
            Delete
          </button>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes modalIn { 
            from { opacity: 0; transform: translateY(8px) scale(0.98); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
          }
        `}</style>
      </div>
    </div>
  );
}
