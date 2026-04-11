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

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert("กรุณากรอกชื่อ Block");
      return;
    }

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2000]" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-[480px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.2s ease" }}
      >
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#1594dd] animate-spin" />
            <p className="text-sm text-gray-500 mt-2 font-medium">กำลังดำเนินการ...</p>
          </div>
        )}

        <div className="bg-[#34495e] px-5 py-4 shrink-0 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditMode ? "Edit Block" : "Add Block"}: {blockType.label}
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              {isEditMode ? "แก้ไขรายละเอียด Block ด้านล่าง" : `กรอกข้อมูลสำหรับ Block รูปแบบ ${blockType.label}`}
            </p>
          </div>
          {isEditMode && (
            <button 
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          )}
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#34495e] mb-1.5">
              Block Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="เช่น หม้อต้มใบที่ 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#34495e] mb-1.5">
              Description
            </label>
            <textarea
              placeholder="รายละเอียดเพิ่มเติม..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all resize-none"
            />
          </div>

          {/* Show full form only for "process" block */}
          {blockType.type === "process" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#34495e] mb-1.5">Cost per Unit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="เช่น 150"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#34495e] mb-1.5">Electricity / Unit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="เช่น 10.5"
                    value={electricityPerUnit}
                    onChange={(e) => setElectricityPerUnit(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#34495e] mb-1.5">Number of People</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="จำนวนคน"
                    value={people}
                    onChange={(e) => setPeople(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#34495e] mb-1.5">Cost per Person</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ค่าใช้จ่ายต่อคน"
                    value={costPerPerson}
                    onChange={(e) => setCostPerPerson(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#34495e] mb-1.5">Duration (minutes/hours)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="ระยะเวลา"
                  value={duration}
                  onChange={(e) => setDuration(e.target.valueAsNumber || (e.target.value === "" ? "" : 0))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1594dd] transition-all"
                />
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3 bg-gray-50 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2 text-sm font-bold text-white bg-[#1594dd] hover:bg-[#1277b5] rounded-lg transition-all"
          >
            {isEditMode ? "Save Changes" : "Save Block"}
          </button>
        </div>
      </div>
    </div>
  );
}
