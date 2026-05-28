"use client";

import { useState, useEffect } from "react";

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
  const [countdown, setCountdown] = useState(2);
  const [isDeleteReady, setIsDeleteReady] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsDeleteReady(true);
    }
  }, [countdown]);

  const handleDelete = async () => {
    setDeleteError("");
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
        setDeleteError(data.message || "Unable to delete the project.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[2001]" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-[420px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col p-8 mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
       {deleteError ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
              <IconAlertTriangle size={24} />
            </div>
            
            <h3 className="text-[22px] font-bold text-gray-900 tracking-tight mb-2">Error</h3>
            <p className="text-[15px] text-gray-500 mb-6 leading-relaxed">
              {deleteError}
            </p>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-[14px] text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
                <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-red-500 animate-spin" />
                <p className="text-sm text-gray-500 mt-3 font-medium">Deleting...</p>
              </div>
            )}

            <div className="mb-2">
              <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">Delete Project</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-[15px] text-slate-500 leading-relaxed font-normal">
                Are you sure you want to delete the project <span className="font-semibold text-gray-900">"{project.name}"</span>? 
                This action cannot be undone, and all data will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 text-[14px] font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !isDeleteReady}
                className={`px-6 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 active:scale-95 ${
                  !isDeleteReady
                    ? "bg-red-50 text-red-400 border border-red-100 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.25)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.35)] cursor-pointer"
                  } ${loading ? "opacity-50 cursor-wait" : ""}`}
              >
                {isDeleteReady ? "Delete" : `Delete (${countdown}s)`}
              </button>
            </div>
          </>
        )}

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