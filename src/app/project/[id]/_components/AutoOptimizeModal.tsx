"use client";

import { useState } from "react";
import { BlockData } from "./editorTypes";
import {
  runProfitOptimizer,
  compareAllStrategies,
  OptimizerResult,
  ProcessBlock,
} from "@/services/optimizer.engine";

interface AutoOptimizeModalProps {
  blocks: BlockData[];
  onClose: () => void;
  onApply: (changes: { blockId: number; people: number }[]) => Promise<void>;
}

// Bridge: convert BlockData → ProcessBlock for optimizer engine
function toProcessBlock(b: BlockData): ProcessBlock {
  return {
    block_id: b.block_id,
    name: b.name,
    step_order: b.step_order,
    duration: Number(b.duration) || 1,
    people: Math.max(1, Number(b.people) || 1),
    cost_per_person: Number(b.cost_per_person) || 0,
    cost_per_unit: Number(b.cost_per_unit) || 0,
    electricity_per_unit: Number(b.electricity_per_unit) || 0,
  };
}

type OptMode = "time" | "cost" | "profit" | "compare";

const MODES: { mode: OptMode; label: string; desc: string }[] = [
  {
    mode: "time",
    label: "เร็วที่สุด",
    desc: "เพิ่มคนจากจำนวนปัจจุบัน เน้นให้ผลิตทันเวลาที่กำหนด",
  },
  {
    mode: "cost",
    label: "ถูกที่สุด",
    desc: "รีเซ็ตคนเป็น 1 แล้วจ้างเพิ่มเฉพาะจุดที่จำเป็นและถูกที่สุด",
  },
  {
    mode: "profit",
    label: "กำไรสูงสุด",
    desc: "วิเคราะห์ทุก Action โดยคิด profit = revenue - (labor+electricity+material) แบบ Marginal เพื่อหาจุดที่ให้กำไรดีสุด",
  },
  {
    mode: "compare",
    label: "เปรียบเทียบ",
    desc: "รันทั้ง 3 กลยุทธ์พร้อมกัน แสดงตัวเลขจริงของแต่ละแบบให้เลือก (ต้องใส่ราคาขาย)",
  },
];

export function AutoOptimizeModal({ blocks, onClose, onApply }: AutoOptimizeModalProps) {
  const [targetUnits, setTargetUnits] = useState(100);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [optMode, setOptMode] = useState<OptMode>("profit");

  const [result, setResult] = useState<OptimizerResult | null>(null);
  const [compareResults, setCompareResults] = useState<Record<string, OptimizerResult> | null>(null);
  const [running, setRunning] = useState(false);
  const [applying, setApplying] = useState(false);

  const processBlocks = blocks
    .filter((b) => b.type === "process")
    .sort((a, b) => a.step_order - b.step_order)
    .map(toProcessBlock);

  const hasChanges = result?.allocations.some(
    (a) => a.suggestedPeople !== a.originalPeople
  );

  const fmtB = (n: number) =>
    new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);

  const handleSolve = () => {
    if (processBlocks.length === 0) return;
    setRunning(true);
    setTimeout(() => {
      const cfg = {
        targetUnits,
        timeLimitMinutes,
        sellingPricePerUnit: sellingPrice,
        // electricity cost is already encoded in each block's electricity_per_unit field
        // budget is not constrained here — optimizer finds the profit-optimal point
      };

      if (optMode === "compare") {
        const cmp = compareAllStrategies(processBlocks, cfg);
        setCompareResults({
          "เร็วที่สุด": cmp.time,
          "ถูกที่สุด": cmp.cost,
          "กำไรสูงสุด": cmp.profit,
        });
      } else {
        const res = runProfitOptimizer(processBlocks, { ...cfg, mode: optMode });
        setResult(res);
      }
      setRunning(false);
    }, 20);
  };

  const handleChooseCompare = (res: OptimizerResult) => {
    setResult(res);
    setCompareResults(null);
  };

  const handleApply = async () => {
    if (!result) return;
    setApplying(true);
    const changes = result.allocations
      .filter((a) => a.suggestedPeople !== a.originalPeople)
      .map((a) => ({ blockId: a.block_id, people: a.suggestedPeople }));
    await onApply(changes);
    setApplying(false);
    onClose();
  };

  const resetAll = () => {
    setResult(null);
    setCompareResults(null);
  };

  const profitColor = (n: number) =>
    n >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[360px] mx-4 rounded-2xl shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
            Auto-Optimize
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {compareResults
              ? "เลือกกลยุทธ์ที่ต้องการ"
              : result
              ? "ผลการวิเคราะห์"
              : "ปรับจำนวนคนงานให้เหมาะสมตามเป้าหมาย"}
          </p>
        </div>

        <div className="px-6 pb-2 space-y-4">
          {/* ──── FORM ──── */}
          {!result && !compareResults && (
            <>
              {/* Mode Selector */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-slate-600">
                  เป้าหมาย Optimization
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {MODES.map(({ mode, label }) => (
                    <button
                      key={mode}
                      onClick={() => setOptMode(mode)}
                      className={`py-2 text-[12px] font-medium rounded-lg transition-all ${
                        optMode === mode
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 ml-1">
                  {MODES.find((m) => m.mode === optMode)?.desc}
                </p>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-slate-600">
                    Target Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-slate-600">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  />
                </div>
                <div
                  className={`space-y-1.5 col-span-2 ${
                    optMode === "compare" || optMode === "profit"
                      ? "ring-2 ring-slate-800 rounded-xl p-2 -mx-1"
                      : ""
                  }`}
                >
                  <label className="text-[12px] font-medium text-slate-600">
                    ราคาขาย / ชิ้น{" "}
                    {(optMode === "compare" || optMode === "profit") && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={sellingPrice || ""}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                  />
                </div>


              </div>
            </>
          )}

          {/* ──── COMPARE CARDS ──── */}
          {compareResults && (
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                เลือกกลยุทธ์ที่เหมาะสม
              </p>
              {Object.entries(compareResults)
                .sort(([, a], [, b]) => b.netProfit - a.netProfit)
                .map(([label, res], i) => {
                  const isBest = i === 0;
                  return (
                    <button
                      key={label}
                      onClick={() => handleChooseCompare(res)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-all hover:shadow-md ${
                        isBest
                          ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`text-[13px] font-semibold ${
                            isBest ? "text-emerald-800" : "text-slate-700"
                          }`}
                        >
                          {label}
                        </span>
                        {isBest && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            แนะนำ ✓
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase">เวลา</p>
                          <p className="text-[12px] font-semibold text-slate-700">
                            {res.totalTime.toFixed(0)}m
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase">ต้นทุน</p>
                          <p className="text-[12px] font-semibold text-slate-700">
                            {fmtB(res.totalCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 uppercase">กำไร</p>
                          <p
                            className={`text-[12px] font-bold ${profitColor(
                              res.netProfit
                            )}`}
                          >
                            {res.netProfit >= 0 ? "+" : ""}
                            {fmtB(res.netProfit)}
                          </p>
                        </div>
                      </div>
                      {/* Breakdown */}
                      <div className="grid grid-cols-3 gap-1 mt-1.5 text-center border-t border-slate-100 pt-1.5">
                        <div>
                          <p className="text-[9px] text-slate-300">ค่าจ้าง</p>
                          <p className="text-[10px] text-slate-500">{fmtB(res.laborCost)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-300">ค่าไฟ</p>
                          <p className="text-[10px] text-slate-500">{fmtB(res.electricityCost)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-300">วัสดุ</p>
                          <p className="text-[10px] text-slate-500">{fmtB(res.materialCost)}</p>
                        </div>
                      </div>
                      {/* Worker tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {res.allocations.map((a) => (
                          <span
                            key={a.block_id}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              a.suggestedPeople !== a.originalPeople
                                ? "bg-slate-900 text-white"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {a.name}: {a.originalPeople}→{a.suggestedPeople}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* ──── RESULT ──── */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Status */}
              <div
                className={`rounded-xl p-3 ${
                  result.withinTimeLimit
                    ? "bg-emerald-50 ring-1 ring-emerald-100"
                    : result.earlyStop
                    ? "bg-blue-50 ring-1 ring-blue-100"
                    : "bg-amber-50 ring-1 ring-amber-100"
                }`}
              >
                <p
                  className={`text-[13px] font-semibold ${
                    result.withinTimeLimit
                      ? "text-emerald-700"
                      : result.earlyStop
                      ? "text-blue-700"
                      : "text-amber-700"
                  }`}
                >
                  {result.withinTimeLimit ? "✓ บรรลุเป้าหมาย" : result.earlyStop ? "⏸ หยุดเพิ่มอัตโนมัติ" : "⚠ ยังไม่ทันเวลา"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{result.stopReason}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เวลา{" "}
                  <span className="font-semibold text-slate-700">
                    {result.totalTime.toFixed(1)} นาที
                  </span>{" "}
                  (เป้า {timeLimitMinutes} นาที)
                </p>
              </div>

              {/* Workers table */}
              <div className="rounded-xl ring-1 ring-slate-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_48px_56px] text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 bg-slate-50">
                  <span>Block</span>
                  <span className="text-center">เดิม</span>
                  <span className="text-center">แนะนำ</span>
                </div>
                {result.allocations.map((a) => {
                  const changed = a.suggestedPeople !== a.originalPeople;
                  return (
                    <div
                      key={a.block_id}
                      className={`grid grid-cols-[1fr_48px_56px] px-3 py-2.5 items-center border-t border-slate-50 ${
                        changed ? "bg-slate-50/60" : ""
                      }`}
                    >
                      <div>
                        <p className="text-[13px] font-medium text-slate-700">{a.name}</p>
                        <p className="text-[10px] text-slate-400">Step {a.step_order}</p>
                      </div>
                      <div className="text-center text-[13px] text-slate-400">
                        {a.originalPeople}
                      </div>
                      <div className="text-center">
                        <span className={`text-[13px] font-semibold ${changed ? "text-slate-900" : "text-slate-400"}`}>
                          {a.suggestedPeople}
                        </span>
                        {changed && (
                          <span className="text-[11px] text-emerald-600 ml-1">
                            +{a.suggestedPeople - a.originalPeople}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  ต้นทุนรวม (หลัง optimize)
                </p>
                {[
                  { label: "ค่าจ้างแรงงาน", value: result.laborCost, color: "text-blue-600" },
                  { label: "ค่าไฟฟ้า", value: result.electricityCost, color: "text-amber-600" },
                  { label: "ค่าวัสดุ", value: result.materialCost, color: "text-slate-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{fmtB(value)} ฿</span>
                  </div>
                ))}
                <div className="flex justify-between text-[12px] border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="font-semibold text-slate-700">รวมต้นทุน</span>
                  <span className="font-bold text-slate-900">{fmtB(result.totalCost)} ฿</span>
                </div>
                {sellingPrice > 0 && (
                  <>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">รายได้</span>
                      <span className="font-semibold text-indigo-600">{fmtB(result.revenue)} ฿</span>
                    </div>
                    <div
                      className={`flex justify-between text-[13px] font-bold border-t border-slate-200 pt-1.5 mt-1.5 ${profitColor(
                        result.netProfit
                      )}`}
                    >
                      <span>กำไรสุทธิ</span>
                      <span>
                        {result.netProfit >= 0 ? "+" : ""}
                        {fmtB(result.netProfit)} ฿
                      </span>
                    </div>
                  </>
                )}
              </div>


            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 space-y-2">
          {!result && !compareResults ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSolve}
                disabled={
                  running ||
                  processBlocks.length === 0 ||
                  ((optMode === "compare" || optMode === "profit") && !sellingPrice)
                }
                className="flex-[2] px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                {running
                  ? "กำลังคำนวณ..."
                  : optMode === "compare"
                  ? "Comparing strategies"
                  : "Solve"}
              </button>
            </div>
          ) : compareResults ? (
            <button
              onClick={resetAll}
              className="w-full px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition border border-slate-200"
            >
              ← กลับ
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition"
              >
                ← Back
              </button>
              <button
                onClick={handleApply}
                disabled={applying || !hasChanges}
                className="flex-[2] px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                {applying ? "กำลัง Apply..." : "Apply Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
