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

  const [errors, setErrors] = useState({ name: "" });
  const [submitError, setSubmitError] = useState("");

  const getNameErrorMessage = (value: string) => {
    if (!value.trim()) return "Please enter a project name.";
    return "";
  };

  const handleSubmit = async () => {
    setSubmitError("");
    
    const nameError = getNameErrorMessage(name);
    if (nameError) {
      setErrors((prev) => ({ ...prev, name: nameError }));
      return;
    }

    // ดึง user_id จาก localStorage
    const stored = sessionStorage.getItem("user");
    if (!stored) {
      setSubmitError("Please log in to continue.");
      return;
    }

    let userId: number;
    try {
      const user = JSON.parse(stored);
      userId = user.user_id;
    } catch {
      setSubmitError("Invalid user data. Please log in again.");
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
          setSubmitError(messages);
        } else {
          setSubmitError(data.message || "An error occurred while saving the project.");
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
      setSubmitError("Unable to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[15px] text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#5d88bd]/15 focus:border-[#5d88bd] transition-all duration-300";
  const nameInputClassName = `w-full rounded-xl px-4 py-2.5 text-[15px] outline-none focus:bg-white focus:ring-4 transition-all duration-300 border ${
    errors.name
      ? "border-red-500 bg-red-50 text-red-900 focus:ring-red-400/20 focus:border-red-500" 
      : "border-slate-200 bg-slate-50 text-gray-800 focus:ring-[#5d88bd]/15 focus:border-[#5d88bd]"
  }`;

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
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#5d88bd] animate-spin" />
            <p className="text-sm text-gray-500 mt-3 font-medium">Processing...</p>
          </div>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-4 shrink-0 flex items-start justify-between relative">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#5d88bd]/10 flex items-center justify-center text-[#5d88bd] mb-4">
              {isEditMode ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              )}
            </div>
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">
              {isEditMode ? "Edit Project" : "Create New Project"}
            </h2>
            <p className="text-[14px] text-slate-500 mt-1 font-medium">
              {isEditMode ? "Update the details of your factory simulation." : "Set up a new factory simulation project."}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-2 overflow-y-auto">
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-[14px] flex gap-2.5 mb-4">
              <svg className="w-5 h-5 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-red-800">Something went wrong</h4>
                <p className="mt-0.5">{submitError}</p>
              </div>
            </div>
          )}

          {/* Project Name */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
                Project Name
              </label>
              <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Required
              </span>
            </div>
            <input
              type="text"
              placeholder="Factory Layout A"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: "" }));
                }
              }}
              className={nameInputClassName}
              autoFocus
            />
            <div className="min-h-[20px] mt-1 mb-2">
              {errors.name && (
                <p className="text-red-500 text-[13px]">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wide">
                Description
              </label>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Optional
              </span>
            </div>
            <textarea
              placeholder="Project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-end shrink-0 bg-slate-50/80 border-t border-slate-100 gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-[14px] font-bold text-slate-600 cursor-pointer hover:text-gray-900 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || isFormIncomplete}
            className={`px-7 py-2.5 text-[14px] font-bold text-white rounded-xl transition-all ${
              loading || isFormIncomplete
                ? "bg-slate-300 cursor-not-allowed opacity-70"
                : "bg-[#5d88bd] cursor-pointer hover:bg-[#4a729e] shadow-[0_4px_12px_rgba(93,136,189,0.3)]"
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
