"use client";

import { useState } from "react";

interface AddBlockModalProps {
  flowId: number;
  stepOrder: number;
  blockType: { type: string; label: string };
  existingBlock?: any;
  onClose: () => void;
  onSuccess: () => void,
  showToast: (message: string) => void;
}

export function AddBlockModal({
  flowId,
  stepOrder,
  blockType,
  existingBlock,
  onClose,
  onSuccess,
  showToast,
}: AddBlockModalProps) {
  const isEditMode = !!existingBlock;
  const [name, setName] = useState(existingBlock?.name || "");
  const [description, setDescription] = useState(existingBlock?.description || "");
  const [costPerUnit, setCostPerUnit] = useState<number | "">(existingBlock?.cost_per_unit || "");
  const [electricityPerUnit, setElectricityPerUnit] = useState<number | "">(existingBlock?.electricity_per_unit || "");
  const [people, setPeople] = useState<number | "">(existingBlock?.people || "");
  const [costPerPerson, setCostPerPerson] = useState<number | "">(existingBlock?.cost_per_person || "");
  const [duration, setDuration] = useState<number | "">(existingBlock?.duration || "");
  const [loading, setLoading] = useState(false);
  
  const isFormIncomplete = !name.trim() || (
    blockType.type === "process" && (
      costPerUnit === "" ||
      electricityPerUnit === "" ||
      people === "" ||
      costPerPerson === "" ||
      duration === ""
    )
  );

  const handleSubmit = async () => {
    if (isFormIncomplete) return;

    setLoading(true);
    try {
      const payload: any = {
        flow_id: flowId,
        step_order: stepOrder,
        type: blockType.type,
        name: name.trim(),
        description: description.trim() || undefined,
        cost_per_unit: costPerUnit === "" ? undefined : Number(costPerUnit),
        electricity_per_unit: electricityPerUnit === "" ? undefined : Number(electricityPerUnit),
        people: people === "" ? undefined : Number(people),
        cost_per_person: costPerPerson === "" ? undefined : Number(costPerPerson),
        duration: duration === "" ? undefined : Number(duration),
      };

      let res;
      if (isEditMode) {
        payload.block_id = existingBlock.block_id;
        res = await fetch("/api/blocks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        if (data.errors) {
          const msgs = Object.values(data.errors.fieldErrors).flat().join("\n");
          showToast(msgs);
        } else {
          showToast(data.message || "Failed to save block.");
        }
      }
    } catch (err) {
      showToast("A server connection error occurred.");
    } finally {
      setLoading(false);
    }
  };


  const inputClassName = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[15px] text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#5d88bd]/15 focus:border-[#5d88bd] transition-all duration-300";
  const labelClassName = "text-[13px] font-bold text-slate-500 uppercase tracking-wide";

  const getIconPath = () => {
    switch (blockType.type) {
      case "start":
        return "/icons/conveyor-belt.png";
      case "process":
        return "/icons/factory-machine.png";
      case "end":
        return "/icons/logistics.png";
      default:
        return null;
    }
  };
  const iconPath = getIconPath();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-2000" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-130 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#5d88bd] animate-spin" />
            <p className="text-sm text-gray-500 mt-3 font-medium">Processing...</p>
          </div>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-4 shrink-0 flex items-start justify-between relative">
          <div>
            {iconPath && (
              <div className="w-12 h-12 rounded-2xl bg-[#5d88bd]/10 flex items-center justify-center mb-4 p-2.5">
                <img src={iconPath} alt={blockType.label} className="w-full h-full object-contain" />
              </div>
            )}
            <h2 className="text-[24px] font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
              {isEditMode ? "Edit Block" : "Add New Block"}
              <span className="text-[#5d88bd] font-semibold text-[13px] uppercase tracking-wide bg-[#5d88bd]/10 px-2.5 py-1 rounded-lg">
                {blockType.label}
              </span>
            </h2>
            <p className="text-[14px] text-slate-500 mt-2 font-medium">
              {isEditMode ? "Modify details and configurations for this flow step." : `Define specifications for this new ${blockType.label} step.`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-2 overflow-y-auto space-y-5">
          {/* Block Name */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClassName}>Block Name</label>
              <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Required
              </span>
            </div>
            <input
              type="text"
              placeholder="Boiler No. 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className={labelClassName}>Description</label>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Optional
              </span>
            </div>
            <textarea
              placeholder="More information..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClassName} resize-none`}
            />
          </div>

          {blockType.type === "process" && (
            <>
              {/* Cost & Electricity */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Cost per Unit</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Electricity / Unit</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="4.2"
                    value={electricityPerUnit}
                    onChange={(e) => setElectricityPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* People & Cost per Person */}
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Number of People</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Number of workers"
                    value={people}
                    onChange={(e) => setPeople(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Cost per Person</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cost per person"
                    value={costPerPerson}
                    onChange={(e) => setCostPerPerson(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelClassName}>Duration (minutes)</label>
                  <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Required
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  placeholder="Production time"
                  value={duration}
                  onChange={(e) => setDuration(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                  className={inputClassName}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 flex items-center justify-end shrink-0 bg-slate-50/80 border-t border-slate-100 gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-[14px] font-bold text-slate-600 hover:text-gray-900 hover:bg-slate-200/50 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isFormIncomplete || loading}
            className={`px-7 py-2.5 text-[14px] font-bold text-white rounded-xl transition-all ${
              isFormIncomplete || loading
                ? "bg-slate-300 cursor-not-allowed opacity-70"
                : "bg-[#5d88bd] hover:bg-[#4a729e] cursor-pointer shadow-[0_4px_12px_rgba(93,136,189,0.3)]"
            }`}
          >
            {isEditMode ? "Save Changes" : "Save Block"}
          </button>
        </div>
      </div>
    </div>
  );
}
