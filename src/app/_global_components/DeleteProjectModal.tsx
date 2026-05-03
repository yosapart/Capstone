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
  const [isDeleteReady, setIsDeleteReady] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fillTimer = setTimeout(() => {
      setIsFilling(true);
    }, 50);

    const timer = setTimeout(() => {
      setIsDeleteReady(true);
    }, 2000);

    return () => {
      clearTimeout(fillTimer);
      clearTimeout(timer);
    };
  }, []); 

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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center z-[2001]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[400px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col p-7 mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.25s cubic-bezier(0, 0, 0.2, 1)" }}
      >
       {deleteError ? (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <IconAlertTriangle size={30} />
            </div>
            
            <h3 className="text-[24px] font-bold text-gray-900 tracking-tight mb-2">Error</h3>
            <p className="text-[16px] text-gray-500 mb-8 leading-relaxed">
              {deleteError}
            </p>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-[16px] text-white font-semibold rounded-xl transition-all shadow-sm"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
              </div>
            )}

            <div className="mb-2">
              <h3 className="text-[24px] font-bold text-gray-900 tracking-tight">Delete Project</h3>
            </div>
            
            <div className="mb-8">
              <p className="text-[16px] text-gray-500 leading-relaxed font-normal">
                Are you sure you want to delete the project <span className="font-medium text-gray-900">"{project.name}"</span>? 
                This action cannot be undone, and all data will be permanently deleted.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-[14px] font-medium text-gray-500 cursor-pointer hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading || !isDeleteReady}
                className={`relative overflow-hidden px-6 py-2 text-[14px] font-semibold text-white rounded-xl transition-all shadow-sm ${
                  !isDeleteReady
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-[#ef4444] hover:bg-[#dc2626] shadow-red-200 cursor-pointer"
                  } ${loading ? "opacity-50 cursor-wait" : ""}`}
              >
                {!isDeleteReady && (
                  <div
                    className="absolute left-0 top-0 h-full bg-[#ef4444] transition-all ease-linear"
                    style={{
                      width: isFilling ? "100%" : "0%",
                      transitionDuration: "2000ms",
                    }}
                  />
                )}
                <span className="relative z-10">Delete</span>
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