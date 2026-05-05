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
    desc: "Resets staff to 1 and hires only at the most critical and cost-effective points.",
  },
  {
    mode: "profit",
    label: "Max Profit",
    desc: "Analyzes every action using marginal profit calculation: Profit = Revenue - (Labor + Electricity + Material) to find the optimal profitability point.",
  },
  {
    mode: "compare",
    label: "Comparison",
    desc: "Runs all three strategies simultaneously, displaying real data for each to help you choose (Selling Price required).",
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
              <div className="space-y-2 pt-2.5 border-t border-slate-100">
                <label className="text-[16px] font-medium text-slate-600">
                  Optimization Goal
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 mt-1 bg-slate-100 rounded-xl">
                  {MODES.map(({ mode, label }) => (
                    <button
                      key={mode}
                      onClick={() => setOptMode(mode)}
                      className={`py-2 text-[14px] cursor-pointer font-medium rounded-lg transition-all ${
                        optMode === mode
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[13px] h-[50px] text-slate-400 ml-1">
                  {MODES.find((m) => m.mode === optMode)?.desc}
                </p>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-600">
                    Target Units
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 mt-1 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-slate-600">
                    Time Limit (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-slate-50 mt-1 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  />
                </div>
                <div className={'space-y-1.5 col-span-2'}>
                  <label className="text-[13px] font-medium text-slate-600">
                    Selling Price / Unit{" "}
                    {(optMode === "compare" || optMode === "profit") && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder={(optMode === "compare" || optMode === "profit") ? "e.g., 250" : "Optional"}
                    className="w-full bg-slate-50 mt-1 ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-2.5 text-sm outline-none"
                    value={sellingPrice || ""}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
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
                      className={`w-full text-left rounded-xl border p-3.5 cursor-pointer transition-all hover:shadow-md ${
                        isBest
                          ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span
                          className={`text-[14px] font-semibold ${
                            isBest ? "text-emerald-800" : "text-slate-700"
                          }`}
                        >
                          {label}
                        </span>
                        {isBest && (
                          <span className="text-[12px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5  rounded-full">
                            Recommended 
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div>
                          <p className="text-[11px] text-slate-600 uppercase">Time</p>
                          <p className="text-[13px] font-semibold text-slate-700">
                            {res.totalTime.toFixed(0)}m
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-600 uppercase">Cost</p>
                          <p className="text-[13px] font-semibold text-slate-700">
                            {fmtB(res.totalCost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-600 uppercase">Profit</p>
                          <p
                            className={`text-[13px] font-bold ${profitColor(
                              res.netProfit
                            )}`}
                          >
                            {res.netProfit >= 0 ? "+" : ""}
                            {fmtB(res.netProfit)}
                          </p>
                        </div>
                      </div>
                      {/* Breakdown */}
                      <div className="grid grid-cols-3 gap-1 mt-1.5 text-center border-t border-slate-200 pt-1.5">
                        <div>
                          <p className="text-[12px] text-slate-400">Labor</p>
                          <p className="text-[11px] text-slate-500">{fmtB(res.laborCost)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-slate-400">Electricity</p>
                          <p className="text-[11px] text-slate-500">{fmtB(res.electricityCost)}</p>
                        </div>
                        <div>
                          <p className="text-[12px] text-slate-400">Materials</p>
                          <p className="text-[11px] text-slate-500">{fmtB(res.materialCost)}</p>
                        </div>
                      </div>
                      {/* Worker tags */}
                      <div className={`flex flex-nowrap gap-2 overflow-x-auto ${styles['custom-scrollbar']}`}>
                        {res.allocations.map((a) => (
                          <span
                            key={a.block_id}
                            className={`text-[11px] my-1.5 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
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
                  className={`text-[14px] font-semibold ${
                    result.withinTimeLimit
                      ? "text-emerald-700"
                      : result.earlyStop
                      ? "text-blue-700"
                      : "text-amber-700"
                  }`}
                >
                  {result.withinTimeLimit ? "✓ Target Achieved" : result.earlyStop ? "⏸ Auto-increment Stopped" : "⚠ Deadline Not Met"}
                </p>
                <p className="text-[13px] text-slate-500 mt-0.5">{result.stopReason}</p>
                <p className="text-[13px] text-slate-500 mt-0.5">
                  Time{" "}
                  <span className="font-semibold text-slate-700">
                    {result.totalTime.toFixed(1)} mins
                  </span>{" "}
                  (Target {timeLimitMinutes} mins)
                </p>
              </div>

              {/* Workers table */}
              <span className="text-[15.5px] font-semibold text-slate-800 uppercase">Workforce Adjustment</span>
              <div className="mt-1 rounded-xl ring-1 ring-slate-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_100px_105px] text-[13px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 bg-slate-50">
                  <span>Block</span>
                  <span className="text-center">Original</span>
                  <span className="text-center">Recommended</span>
                </div>
                {result.allocations.map((a) => {
                  const changed = a.suggestedPeople !== a.originalPeople;
                  return (
                    <div
                      key={a.block_id}
                      className={`grid grid-cols-[1fr_100px_105px] px-3 py-2.5 items-center border-t border-slate-50 ${
                        changed ? "bg-slate-50/60" : ""
                      }`}
                    >
                      <div>
                        <p className="text-[13px] font-medium text-slate-700">
                          {a.name.length > 12 ? a.name.substring(0, 12) + "..." : a.name}
                        </p>
                        <p className="text-[12px] text-slate-400">Step {a.step_order}</p>
                      </div>
                      <div className="text-center text-[13px] text-slate-400">
                        {a.originalPeople}
                      </div>
                      <div className="text-center">
                        <span className={`text-[13px] font-semibold ${changed ? "text-slate-900" : "text-slate-400"}`}>
                          {a.suggestedPeople}
                        </span>
                        {changed && (
                          <span className="text-[12px] text-emerald-600 ml-1">
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
                <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Total Cost (Optimized)
                </p>
                {[
                  { label: "Labor Costs", value: result.laborCost, color: "text-blue-600" },
                  { label: "Electricity Costs", value: result.electricityCost, color: "text-amber-600" },
                  { label: "Material Costs", value: result.materialCost, color: "text-slate-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between text-[13px]">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-semibold ${color}`}>{fmtB(value)} ฿</span>
                  </div>
                ))}
                <div className="flex justify-between text-[13px] border-t border-slate-200 pt-1.5 mt-1.5">
                  <span className="font-semibold text-slate-700">Total Cost</span>
                  <span className="font-bold text-slate-900">{fmtB(result.totalCost)} ฿</span>
                </div>
                {sellingPrice > 0 && (
                  <>
                    <div className="flex justify-between text-[13px]">
                      <span className="text-slate-500">Revenue</span>
                      <span className="font-semibold text-indigo-600">{fmtB(result.revenue)} ฿</span>
                    </div>
                    <div
                      className={`flex justify-between text-[14px] font-bold border-t border-slate-200 pt-1.5 mt-1.5 ${profitColor(
                        result.netProfit
                      )}`}
                    >
                      <span>Net Profit</span>
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
                className="flex-1 px-4 py-3 text-[14px] font-medium cursor-pointer text-slate-600 hover:bg-slate-50 rounded-xl transition"
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
