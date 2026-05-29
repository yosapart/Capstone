"use client";

import { useState } from "react";
import { BlockData } from "./editorTypes";
import {
  runProfitOptimizer,
  compareAllStrategies,
  OptimizerResult,
  ProcessBlock,
} from "@/services/optimizer.engine";

import styles from './scrollbar.module.css';

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
    label: "Fastest Time",
    desc: "Increases staff from current levels, prioritizing meeting the set deadline.",
  },
  {
    mode: "cost",
    label: "Lowest Cost",
    desc: "Starts from current staff, can both reduce excess workers and hire at bottlenecks to find the cheapest plan that meets your deadline.",
  },
  {
    mode: "profit",
    label: "Max Profit",
    desc: "Starts from current staff and evaluates adding or reducing workers using marginal profit + opportunity gain analysis to find the most profitable point.",
  },
  {
    mode: "compare",
    label: "Comparison",
    desc: "Runs all three strategies simultaneously, displaying real data for each to help you choose (Selling Price required).",
  },
];

export function AutoOptimizeModal({ blocks, onClose, onApply }: AutoOptimizeModalProps) {
  const [targetUnits, setTargetUnits] = useState<number | "">("");
  const [isOpen, setIsOpen] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
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
        targetUnits: Number(targetUnits) || 0,
        timeLimitMinutes: Number(timeLimitMinutes) || 0,
        sellingPricePerUnit: Number(sellingPrice) || 0,
        // electricity cost is already encoded in each block's electricity_per_unit field
        // budget is not constrained here — optimizer finds the profit-optimal point
      };

      if (optMode === "compare") {
        const cmp = compareAllStrategies(processBlocks, cfg);
        setCompareResults({
          "Fastest Time": cmp.time,
          "Lowest Cost": cmp.cost,
          "Max Profit": cmp.profit,
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
        className="bg-white w-full max-w-[470px] mx-4 rounded-2xl shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-[22px] font-semibold text-slate-800 tracking-tight">
            Auto-Optimize
          </h2>
          <p className="text-[16px] text-slate-400 mt-0.4">
            {compareResults
              ? "Select preferred strategy"
              : result
                ? "Analysis Results"
                : "Optimize workforce based on targets."}
          </p>
        </div>

        <div className="px-6 pb-2 space-y-4.5">
          {/* ──── FORM ──── */}
          {!result && !compareResults && (
            <>
              {/* Mode Selector */}
              <div className="space-y-3 pt-3 border-t border-slate-100 relative">
                <label className="text-[16px] font-medium text-slate-600">
                  Optimization Goal
                </label>
                <div className="relative mt-2">
                  {/* หัวข้อ Dropdown หลัก */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center justify-between bg-slate-50 border ${isOpen ? "border-slate-400 ring-2 ring-slate-900/5" : "border-slate-200"
                      } rounded-xl p-2.5 text-sm font-medium text-slate-800 outline-none cursor-pointer transition-all`}
                  >
                    <span>{MODES.find((m) => m.mode === optMode)?.label}</span>
                    {/* ลูกศรที่สามารถหมุน ขึ้น-ลง ได้ด้วย transition */}
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* รายการตัวเลือกแบบลอยตัว (Custom Menu เหมือนรูปขวา) */}
                  {isOpen && (
                    <>
                      {/* Backdrop เล็กๆ ป้องกันการกดซ้อนและใช้ปิดเมื่อคลิกข้างนอกกล่อง */}
                      <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                      <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl p-1 z-20 max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                        {MODES.map(({ mode, label }) => {
                          const isSelected = optMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => {
                                setOptMode(mode);
                                setIsOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-between ${isSelected
                                  ? "bg-slate-100 text-slate-900 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                }`}
                            >
                              <span>{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* คำอธิบายของโหมดที่เลือก */}
                <p className="text-[13px] h-[50px] text-slate-400 ml-1 mt-1.5 leading-relaxed">
                  {MODES.find((m) => m.mode === optMode)?.desc}
                </p>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-600">
                    Target Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="100"
                    className="w-full bg-slate-50 mt-1 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[14px] font-medium text-slate-600">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="480"
                    className="w-full bg-slate-50 mt-1 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className={'space-y-1.5 col-span-2'}>
                  <label className="text-[14px] font-medium text-slate-600">
                    Selling Price / Unit
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="250"
                    className="w-full bg-slate-50 mt-1 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>


              </div>
            </>
          )}

          {/* ──── COMPARE CARDS ──── */}
          {compareResults && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <p className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
                Select the optimal strategy.
              </p>
              {Object.entries(compareResults)
                .sort(([, a], [, b]) => b.netProfit - a.netProfit)
                .map(([label, res], i) => {
                  const isBest = i === 0;
                  return (
                    <button
                      key={label}
                      onClick={() => handleChooseCompare(res)}
                      className={`w-full text-left rounded-xl border p-3.5 cursor-pointer transition-all hover:shadow-md ${isBest
                          ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="text-left">
                          <span
                            className={`text-base font-bold tracking-tight ${isBest ? "text-emerald-800" : "text-slate-800"
                              }`}
                          >
                            {label}
                          </span>
                          <p className="text-[12px] text-slate-500 mt-0.5 leading-tight">
                            {label === "Fastest Time" && "Completes production as fast as possible"}
                            {label === "Lowest Cost" && "Minimizes overall operational expenses"}
                            {label === "Max Profit" && "Maximizes total net profit"}
                          </p>
                        </div>
                        {isBest && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 shadow-sm rounded-full uppercase tracking-wide">
                            Recommended
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center bg-white/60 rounded-xl p-3 shadow-sm border border-slate-100/50">
                        <div className="text-center flex-1 border-r border-slate-200/60">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Time</p>
                          <p className="text-[15px] font-bold text-slate-700">
                            {res.totalTime.toFixed(0)}<span className="text-xs font-medium text-slate-500 ml-0.5">m</span>
                          </p>
                        </div>
                        <div className="text-center flex-1 border-r border-slate-200/60">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cost</p>
                          <p className="text-[15px] font-bold text-slate-700">
                            {fmtB(res.totalCost)}<span className="text-xs font-medium text-slate-500 ml-0.5">฿</span>
                          </p>
                        </div>
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Profit</p>
                          <p
                            className={`text-[15px] font-bold ${profitColor(
                              res.netProfit
                            )}`}
                          >
                            {res.netProfit >= 0 ? "+" : ""}
                            {fmtB(res.netProfit)}<span className="text-xs font-medium opacity-70 ml-0.5">฿</span>
                          </p>
                        </div>
                      </div>

                      {/* Worker change summary */}
                      {(() => {
                        const changed = res.allocations.filter((a) => a.suggestedPeople !== a.originalPeople).length;
                        return (
                          <div className="mt-3.5 text-center">
                            {changed > 0 ? (
                              <span className="text-[12px] font-medium text-slate-500 bg-slate-100/80 px-3 py-1 rounded-full">
                                Requires adjustment in {changed} department{changed > 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-[12px] font-medium text-slate-400">
                                No workforce changes needed
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </button>
                  );
                })}
            </div>
          )}

          {/* ──── RESULT ──── */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      result.withinTimeLimit
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                        : result.earlyStop
                        ? "bg-slate-400"
                        : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1">
                    <h3 className="text-[16px] font-semibold tracking-tight text-slate-900">
                      {result.withinTimeLimit
                        ? "Optimization Successful"
                        : result.earlyStop
                        ? "Optimization Stopped"
                        : "Deadline Not Met"}
                    </h3>
                    <p className="text-[13.5px] text-slate-500 mt-1 leading-relaxed">
                      {result.withinTimeLimit
                        ? "We found the best workforce setup to maximize your profit while meeting the deadline."
                        : result.stopReason}
                    </p>

                    <div className="flex flex-wrap gap-8 mt-5 pt-5 border-t border-slate-100">
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 mb-1">Estimated Time</p>
                        <p className="text-[15px] font-semibold text-slate-800 tracking-tight">
                          {result.totalTime.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mins</span>
                        </p>
                      </div>
                      {result.timeSaved > 0 && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 mb-1">Time Saved</p>
                          <p className="text-[15px] font-semibold text-emerald-600 tracking-tight">
                            {result.timeSaved.toFixed(1)} <span className="text-xs text-emerald-600/70 font-normal">mins</span>
                          </p>
                        </div>
                      )}
                      {result.overduePenalty > 0 && (
                        <div>
                          <p className="text-[11px] font-medium text-slate-400 mb-1">Overdue Penalty</p>
                          <p className="text-[15px] font-semibold text-red-600 tracking-tight">
                            {fmtB(result.overduePenalty)} <span className="text-xs text-red-600/70 font-normal">฿</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Workers table */}
              <div className="pt-2">
                <h4 className="text-[13px] font-semibold text-slate-900 mb-3 tracking-tight">
                  Workforce Adjustments
                </h4>
                <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1fr_70px_70px_70px] sm:grid-cols-[1fr_80px_80px_80px] items-center text-[11px] font-medium text-slate-500 bg-slate-50/50 px-4 py-2 border-b border-slate-200">
                    <span>Department</span>
                    <span className="text-right">Original</span>
                    <span className="text-right">New</span>
                    <span className="text-right">Change</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
                    {result.allocations.map((a) => {
                      const changed = a.suggestedPeople !== a.originalPeople;
                      const diff = a.suggestedPeople - a.originalPeople;
                      return (
                        <div
                          key={a.block_id}
                          className={`grid grid-cols-[1fr_70px_70px_70px] sm:grid-cols-[1fr_80px_80px_80px] items-center px-4 py-3 transition-colors ${
                            changed ? "bg-white" : "bg-slate-50/30 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] font-medium text-slate-400 w-4 flex-shrink-0">
                              {a.step_order}.
                            </span>
                            <span
                              className={`text-[13px] truncate ${changed ? "font-medium text-slate-700" : ""}`}
                              title={a.name}
                            >
                              {a.name}
                            </span>
                          </div>
                          <div className="text-right text-[13px]">
                            {a.originalPeople}
                          </div>
                          <div className={`text-right text-[13px] ${changed ? "font-semibold text-slate-900" : ""}`}>
                            {a.suggestedPeople}
                          </div>
                          <div className="text-right text-[13px]">
                            {changed ? (
                              <span
                                className={`inline-flex items-center justify-center min-w-[32px] px-1.5 py-0.5 rounded text-[11.5px] font-medium ${
                                  diff > 0 ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="pt-2">
                <h4 className="text-[13px] font-semibold text-slate-900 mb-3 tracking-tight">
                  Financial Summary
                </h4>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left: Costs */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Labor</span>
                        <span className="font-medium text-slate-700">{fmtB(result.laborCost)} ฿</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Electricity</span>
                        <span className="font-medium text-slate-700">{fmtB(result.electricityCost)} ฿</span>
                      </div>
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="text-slate-500">Materials</span>
                        <span className="font-medium text-slate-700">{fmtB(result.materialCost)} ฿</span>
                      </div>
                      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[13px] font-medium text-slate-900">Total Cost</span>
                        <span className="text-[15px] font-semibold text-slate-900 tracking-tight">
                          {fmtB(result.totalCost)} ฿
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Net Profit */}
                  {Number(sellingPrice) > 0 && (
                    <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center relative">
                      <p className="text-[13px] font-medium text-slate-500 mb-1.5">Net Profit</p>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-[32px] font-bold tracking-tighter leading-none ${
                            result.netProfit >= 0 ? "text-slate-900" : "text-red-600"
                          }`}
                        >
                          {result.netProfit >= 0 ? "+" : ""}
                          {fmtB(result.netProfit)}
                        </span>
                        <span className="text-[15px] font-semibold text-slate-400">฿</span>
                      </div>
                      
                      <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-slate-400">Base Revenue</span>
                          <span className="font-medium text-slate-600">{fmtB(result.revenue)} ฿</span>
                        </div>
                        {result.opportunityGain > 0 && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-emerald-600/80">Time Saved Bonus</span>
                            <span className="font-medium text-emerald-600">+{fmtB(result.opportunityGain)} ฿</span>
                          </div>
                        )}
                        {result.overduePenalty > 0 && (
                          <div className="flex justify-between items-center text-[12px]">
                            <span className="text-red-500/80">Delay Penalty</span>
                            <span className="font-medium text-red-600">-{fmtB(result.overduePenalty)} ฿</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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
                className="flex-1 px-4 py-3 text-[14px] font-medium cursor-pointer text-slate-600 hover:bg-slate-50 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSolve}
                disabled={
                  running ||
                  processBlocks.length === 0 ||
                  !targetUnits ||
                  !timeLimitMinutes ||
                  !sellingPrice
                }
                className="flex-[2] px-4 py-3 bg-slate-900 cursor-pointer hover:bg-slate-800 disabled:bg-slate-300 text-white text-[14px] font-semibold rounded-xl transition shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                {running
                  ? "Calculating..."
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
              ← Return
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 px-4 py-3 text-[14px] font-medium cursor-pointer text-slate-600 hover:bg-slate-50 rounded-xl transition"
              >
                ← Back
              </button>
              <button
                onClick={handleApply}
                disabled={applying || !hasChanges}
                className="flex-[2] px-4 py-3 bg-slate-900 cursor-pointer hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-slate-200 active:scale-[0.98]"
              >
                {applying ? "Applying changes..." : "Apply Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
