"use client";

import { useState } from "react";
import { BlockData } from "./editorTypes";
import {
  runProfitOptimizer,
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


export function AutoOptimizeModal({ blocks, onClose, onApply }: AutoOptimizeModalProps) {
  const [targetUnits, setTargetUnits] = useState<number | "">("");
  const [isOpen, setIsOpen] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");

  const [result, setResult] = useState<OptimizerResult | null>(null);
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

  const labelClassName = "text-[13px] font-bold text-slate-500 uppercase tracking-wide";

  const isFormIncomplete = 
    processBlocks.length === 0 || 
    targetUnits === "" || 
    timeLimitMinutes === "" || 
    sellingPrice === "";

  const handleSolve = () => {
    if (isFormIncomplete) return;
    
    setRunning(true);
    setTimeout(() => {
      const cfg = {
        targetUnits: Number(targetUnits) || 0,
        timeLimitMinutes: Number(timeLimitMinutes) || 0,
        sellingPricePerUnit: Number(sellingPrice) || 0,
        mode: "profit" as const,
        // electricity cost is already encoded in each block's electricity_per_unit field
        // budget is not constrained here — optimizer finds the profit-optimal point
      };

      const res = runProfitOptimizer(processBlocks, cfg);
      setResult(res);
      setRunning(false);
    }, 20);
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
  };

  const profitColor = (n: number) =>
    n >= 0 ? "text-emerald-600" : "text-red-500";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-117.5 mx-4 rounded-2xl shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-[22px] font-semibold text-slate-800 tracking-tight">
            Auto-Optimize
          </h2>
          <p className="text-[16px] text-slate-400 mt-0.4">
            {result
              ? "Analysis Results"
              : "Optimize workforce based on targets."}
          </p>
        </div>

        <div className="px-6 pb-2 space-y-4.5">
          {/* ──── FORM ──── */}
          {!result && (
            <>
              {/* Static Mode Indicator */}
              <div className="space-y-2 pt-3 border-t border-slate-100 mb-4">
                <label className={labelClassName}>Optimization Goal</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">Max Profit</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  </div>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-[12.5px] text-slate-500 ml-1 leading-relaxed">
                  Evaluates adding or reducing workers using marginal profit + opportunity gain analysis to find the most profitable point.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Target Units</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Time Limit (min)</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    placeholder="480"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
                <div className={'space-y-1.5 col-span-2'}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={labelClassName}>Selling Price / Unit</label>
                    <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      Required
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    placeholder="250"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 rounded-xl p-2.5 text-sm outline-none transition-all [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>
              </div>
            </>
          )}


          {/* ──── RESULT ──── */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {/* Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
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
                  <div className="divide-y divide-slate-100 max-h-70 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent">
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
                            <span className="text-[11px] font-medium text-slate-400 w-4 shrink-0">
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
                                className={`inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded text-[11.5px] font-medium ${
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
          {!result ? (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 text-[14px] font-medium cursor-pointer text-slate-600 hover:bg-slate-50 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSolve}
                disabled={running || isFormIncomplete}
                className={`flex-2 px-4 py-3 text-[14px] text-white font-semibold rounded-xl transition-all ${
                  running || isFormIncomplete
                    ? "bg-slate-300 cursor-not-allowed opacity-70"
                    : "bg-slate-900 cursor-pointer hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-[0.98]"
                }`}
              >
                {running ? "Calculating..." : "Solve"}
              </button>
            </div>
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
                className={`flex-2 px-4 py-3 text-white text-[14px] font-semibold rounded-xl transition-all ${
                  applying || !hasChanges
                    ? "bg-slate-300 cursor-not-allowed opacity-70"
                    : "bg-slate-900 cursor-pointer hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-[0.98]"
                }`}
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