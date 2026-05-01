"use client";

import { useState } from "react";

interface AddBlockModalProps {
  flowId: number;
  stepOrder: number;
  blockType: { type: string; label: string };
  existingBlock?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBlockModal({
  flowId,
  stepOrder,
  blockType,
  existingBlock,
  onClose,
  onSuccess,
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
          alert(msgs);
        } else {
          alert(data.message || "บันทึก Block ไม่สำเร็จ");
        }
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;
    if (!confirm("คุณแน่ใจว่าต้องการลบ Block นี้?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/blocks?block_id=${existingBlock.block_id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || "ลบ Block ไม่สำเร็จ");
        console.error("Delete Error details:", data);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full bg-[#fbfbf9] border border-[#e8e8e3] rounded-xl px-4 py-2.5 text-[15px] text-gray-800 outline-none focus:bg-white focus:ring-4 focus:ring-[#8F9E8B]/15 focus:border-[#8F9E8B] transition-all duration-300";
  const labelClassName = "block text-[13px] font-medium text-gray-500 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[2000]" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-[520px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-[#8F9E8B] animate-spin" />
            <p className="text-sm text-gray-500 mt-3 font-medium">กำลังดำเนินการ...</p>
          </div>
        )}

        <div className="px-8 pt-8 pb-2 shrink-0 flex justify-between items-start">
          <div>
            <h2 className="text-[22px] font-medium text-gray-800 tracking-tight">
              {isEditMode ? "Edit Block" : "Add Block"}<span className="text-gray-400 font-light ml-2">/ {blockType.label}</span>
            </h2>
            <p className="text-[14px] text-gray-400 mt-1 font-light">
              {isEditMode ? "แก้ไขรายละเอียดสำหรับกระบวนการนี้" : `กำหนดรายละเอียดสำหรับกระบวนการ ${blockType.label}`}
            </p>
          </div>
        </div>

        <div className="px-8 py-6 overflow-y-auto space-y-5">
          <div>
            <label className={labelClassName}>
              Block Name <span className="text-[#d97777]">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น หม้อต้มใบที่ 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
              autoFocus
            />
          </div>

          <div>
            <label className={labelClassName}>Description</label>
            <textarea
              placeholder="รายละเอียดเพิ่มเติม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`${inputClassName} resize-none`}
            />
          </div>

          {blockType.type === "process" && (
            <>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClassName}>Cost per Unit <span className="text-[#d97777]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="เช่น 150"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Electricity / Unit <span className="text-[#d97777]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="เช่น 10.5"
                    value={electricityPerUnit}
                    onChange={(e) => setElectricityPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelClassName}>Number of People <span className="text-[#d97777]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="จำนวนคน"
                    value={people}
                    onChange={(e) => setPeople(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Cost per Person <span className="text-[#d97777]">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ค่าใช้จ่าย/คน"
                    value={costPerPerson}
                    onChange={(e) => setCostPerPerson(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label className={labelClassName}>Duration (minutes) <span className="text-[#d97777]">*</span></label>
                <input
                  type="number"
                  min="0"
                  placeholder="เวลาที่ใช้ในการผลิต"
                  value={duration}
                  onChange={(e) => setDuration(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                  className={inputClassName}
                />
              </div>
            </>
          )}
        </div>

        <div className="px-8 py-5 flex items-center justify-between shrink-0 bg-white border-t border-[#f4f4f4]">
          <div>
            {isEditMode && (
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-[14px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Delete block
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-[14px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isFormIncomplete || loading}
              className={`px-7 py-2.5 text-[14px] font-semibold text-white rounded-xl transition-all ${
                isFormIncomplete || loading
                  ? "bg-gray-300 cursor-not-allowed opacity-70"
                  : "bg-[#4CAF50] hover:bg-[#43A047] shadow-[0_4px_12px_rgba(76,175,80,0.3)]"
              }`}
            >
              {isEditMode ? "Save Changes" : "Save Block"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
