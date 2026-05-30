"use client";

import { BlockData, BLOCK_TYPES, SimulationResult } from "./editorTypes";
import { useState, useEffect, useRef } from "react";

interface EditorRightPanelProps {
  blocks: BlockData[];
  onDeleteBlock?: (blockId: number) => void;
  onEditBlock?: (blockId: number) => void;
  onReorderBlocks?: (newBlocks: BlockData[]) => void;
  simulationResult?: SimulationResult | null;
  playbackState?: any;
}

export function EditorRightPanel({
  blocks, onDeleteBlock, onEditBlock, onReorderBlocks,
  simulationResult, playbackState
}: EditorRightPanelProps) {
  const [rightTab, setRightTab] = useState<"your" | "result">("your");

  // Local state for Drag and drop
  const [localBlocks, setLocalBlocks] = useState<BlockData[]>(blocks);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  // Auto-switch to Result tab when simulation completes
  useEffect(() => {
    if (simulationResult) {
      setRightTab("result");
    }
  }, [simulationResult]);

  const handleDragStart = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLDivElement>, position: number) => {
    if (dragItem.current === null) return;
    dragOverItem.current = position;

    // Swap items in local array instantly while hovering over it
    const items = [...localBlocks];
    const dragContent = items[dragItem.current];
    items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragContent);
    // Update the dragged pointer so it continues accurately
    dragItem.current = position;
    setLocalBlocks(items);
  };

  const handleDragEnd = () => {
    dragItem.current = null;
    dragOverItem.current = null;

    // Commit the new order, automatically reassigning step numbers 1 to N
    if (onReorderBlocks) {
      const reordered = localBlocks.map((b, idx) => ({
        ...b,
        step_order: idx + 1
      }));
      onReorderBlocks(reordered);
    }
  };

  // ─── ป้องกันปัญหา -0 (Negative Zero) ───
  const safeZero = (n: number) => Math.abs(n) < 0.001 ? 0 : n;

  const fmt = (n: number) => safeZero(n).toLocaleString("th-TH", { maximumFractionDigits: 2 });
  
  const fmtCompact = (n: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(safeZero(n));
  };

  const formatTime = (totalMins: number) => {
    if (totalMins < 60) return { value: fmt(totalMins), unit: "Minutes" };
    const hours = totalMins / 60;
    return { value: fmt(hours), unit: "Hours" };
  };

  return (
    <aside className="w-65 bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setRightTab("your")}
          className={`flex-1 py-2.5 text-[14px] cursor-pointer font-semibold transition-colors ${rightTab === "your"
            ? "text-[#5d88bd] border-b-2 border-[#5d88bd]"
            : "text-gray-400 hover:text-gray-600"
            }`}
        >
          Process
        </button>
        <button
          onClick={() => setRightTab("result")}
          className={`flex-1 py-2.5 text-[14px] cursor-pointer font-semibold transition-colors ${rightTab === "result"
            ? "text-[#5d88bd] border-b-2 border-[#5d88bd]"
            : "text-gray-400 hover:text-gray-600"
            }`}
        >
          Result
          {simulationResult && rightTab !== "result" && (
            <span className="absolute top-1.5 right-3 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {rightTab === "your" && (
          <div className="space-y-2">
            {localBlocks.length === 0 ? (
              <p className="text-gray-400 text-[14px] text-center mt-20">No blocks found.</p>
            ) : (
              localBlocks.map((block, index) => {
                const bt = BLOCK_TYPES.find((b) => b.type === block.type);
                return (
                  <div
                    key={block.block_id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="group bg-gray-50 rounded-md p-2 border border-gray-200 relative hover:bg-white hover:shadow-sm transition-all flex justify-between items-start cursor-move"
                  >
                    {/* Clickable area for editing */}
                    <div
                      className={`flex-1 ${block.type === "process" ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() => {
                        if (block.type === "process" && onEditBlock) {
                          onEditBlock(block.block_id);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 shrink-0 flex items-center justify-center overflow-hidden">
                          {bt?.icon ? (
                            <img src={bt.icon} alt={block.name} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full rounded-sm border" style={{ borderColor: bt?.border || "#999", backgroundColor: `${bt?.color || "#666"}30` }} />
                          )}
                        </div>
                        <span className={`text-[14px] font-semibold text-[#34495e] truncate whitespace-nowrap block min-w-0 ${block.type === "process" ? "hover:text-[#5d88bd] transition-colors" : ""}`}>
                          {block.name.length > 15 ? block.name.substring(0, 15) + "..." : block.name}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-gray-400 mt-0.5">Step {block.step_order}</p>
                    </div>

                    {/* Trash Button showing on hover */}
                    {onDeleteBlock && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.block_id);
                        }}
                        className="opacity-0 cursor-pointer group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 ml-2 shrink-0"
                        title="Delete Block"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {rightTab === "result" && (
          /* ─── RESULT TAB: Simulation Results ─── */
          <div>
            {!simulationResult ? (
              <div className="text-center mt-20">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-[14px]">No results available.</p>
                <p className="text-gray-300 text-[12px] mt-1">Press Play to run the simulation.</p>
              </div>
            ) : (
              <div className="space-y-5">

                {/* ── Production Stats ── */}
                <div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.14em] mb-3">Production</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Output</p>
                      <p className="text-[20px] font-bold text-slate-800 leading-none tabular-nums">
                        {playbackState ? (
                          <span className="text-violet-600">{fmtCompact(playbackState.currentProduce)}</span>
                        ) : fmtCompact(simulationResult.target_output)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {playbackState ? `/ ${fmtCompact(simulationResult.target_output)} ` : ""}PCS
                      </p>
                    </div>
                    {(() => {
                      const t = formatTime(playbackState ? playbackState.duration : simulationResult.total_duration);
                      return (
                        <div>
                          <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Time</p>
                          <p className="text-[20px] font-bold text-slate-800 leading-none tabular-nums">{t.value}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{t.unit}</p>
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Total Cost</p>
                      <p className="text-[20px] font-bold text-slate-800 leading-none tabular-nums">
                        {fmtCompact(playbackState ? playbackState.cost : simulationResult.total_cost)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">THB</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Power</p>
                      <p className="text-[20px] font-bold text-slate-800 leading-none tabular-nums">
                        {fmtCompact(playbackState ? playbackState.electricity : simulationResult.total_electricity)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Units</p>
                    </div>
                  </div>
                </div>

                {/* ── Financials ── */}
                {simulationResult.selling_price_per_unit && (() => {
                  // ใช้ safeZero เพื่อดักตัวเลข -0 ให้กลายเป็น 0 
                  const currentRevenue = safeZero(playbackState ? (playbackState.revenue || 0) : (simulationResult.total_revenue || 0));
                  const currentOppGain = safeZero(playbackState ? (playbackState.opportunityGain || 0) : (simulationResult.opportunity_gain || 0));
                  const currentCost = safeZero(playbackState ? playbackState.cost : simulationResult.total_cost);
                  const currentPenalty = safeZero(playbackState ? (playbackState.overduePenalty || 0) : (simulationResult.overdue_penalty || 0));
                  const currentNetProfit = safeZero(playbackState ? (playbackState.netProfit || 0) : (simulationResult.net_profit || 0));
                  
                  const isProfit = currentNetProfit >= 0;
                  
                  return (
                    <div>
                      <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.14em] mb-3">Financials</p>
                      <div className="space-y-0">
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <div>
                            <p className="text-[12px] font-medium text-slate-600 leading-none">Revenue</p>
                          </div>
                          <p className="text-[12px] font-bold text-slate-700 tabular-nums">
                            {fmtCompact(currentRevenue)}
                            <span className="text-[8.5px] font-normal text-slate-400 ml-1">THB</span>
                          </p>
                        </div>
                        {(simulationResult.time_limit_minutes || 0) > 0 && (
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <div>
                              <p className="text-[12px] font-medium text-slate-600 leading-none">Opportunity Gain</p>
                            </div>
                            <p className="text-[12px] font-bold text-emerald-600 tabular-nums">
                              {currentOppGain > 0 ? "+" : ""}{fmtCompact(currentOppGain)}
                              <span className="text-[8.5px] font-normal text-slate-400 ml-1">THB</span>
                            </p>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                          <div>
                            <p className="text-[11px] font-medium text-slate-600 leading-none">Total Cost</p>
                          </div>
                          <p className="text-[12px] font-bold text-slate-500 tabular-nums">
                            {currentCost > 0 ? "−" : ""}{fmtCompact(Math.abs(currentCost))}
                            <span className="text-[8.5px] font-normal text-slate-400 ml-1">THB</span>
                          </p>
                        </div>
                        {(simulationResult.time_limit_minutes || 0) > 0 && (
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-100">
                            <div>
                              <p className="text-[12px] font-medium text-slate-600 leading-none">Late Delivery Penalty</p>
                            </div>
                            <p className="text-[12px] font-bold text-rose-500 tabular-nums">
                              {currentPenalty > 0 ? "−" : ""}{fmtCompact(Math.abs(currentPenalty))}
                              <span className="text-[8.5px] font-normal text-slate-400 ml-1">THB</span>
                            </p>
                          </div>
                        )}
                      </div>
                      <div className={`mt-2.5 flex items-center justify-between px-3 py-2.5 rounded-lg ${
                        isProfit ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"
                      }`}>
                        <div>
                          <p className={`text-[12px] font-black uppercase tracking-widest ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>Net Profit</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-[18px] font-black tabular-nums leading-none ${isProfit ? "text-emerald-600" : "text-rose-600"}`}>
                            {currentNetProfit > 0 ? "+" : currentNetProfit < 0 ? "−" : ""}
                            {fmtCompact(Math.abs(currentNetProfit))}
                          </p>
                          <p className="text-[8.5px] text-slate-400 font-semibold mt-0.5">THB</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Steps ── */}
                <div>
                  <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.14em] mb-3">Steps</p>
                  <div className="space-y-2">
                    {simulationResult.steps.map((step, i) => {
                      const isStartEnd = step.type === "start" || step.type === "end";
                      const bt = BLOCK_TYPES.find((b) => b.type === step.type);
                      return (
                        <div key={i} className="group relative">
                          
                          {!isStartEnd && !step.skipped && step.isBottleneck && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-40 px-2.5 py-1.5 bg-rose-100 text-rose-500 text-[11px] text-center font-medium rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl">
                              Bottleneck: Maximum queue — delaying the entire line.
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-rose-100"></div>
                            </div>
                          )}

                          <div className={`rounded-lg border overflow-hidden ${
                            step.skipped ? "border-red-100 bg-red-50/60" : isStartEnd ? "border-slate-100 bg-slate-50/40" : "border-slate-100 bg-white"
                          }`}>
                            <div className="flex items-center gap-2 px-2.5 py-2">
                              <div className="w-3 h-3 shrink-0">
                                {bt?.icon ? (
                                  <img src={bt.icon} alt={step.name} className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${bt?.color || "#aaa"}30`, border: `1.5px solid ${bt?.border || "#ccc"}` }} />
                                )}
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700 flex-1 truncate">{step.name}</span>
                              {step.skipped && <span className="text-[8px] font-bold text-red-400 uppercase bg-red-100 px-1.5 py-0.5 rounded shrink-0">Skip</span>}
                              {!isStartEnd && !step.skipped && step.isBottleneck && (
                                <span className="text-[8px] font-bold text-rose-500 uppercase bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded shrink-0 animate-pulse">BN</span>
                              )}
                            </div>
                            {!isStartEnd && !step.skipped && (
                              <div className="grid grid-cols-3 gap-px border-t border-slate-100">
                                {[
                                  { label: "Cost", value: fmt(step.cost || 0) },
                                  { label: "Power", value: fmt(step.electricity || 0) },
                                  { label: "Time", value: fmt(step.duration || 0) },
                                  ...(step.maxQueue !== undefined ? [
                                    { label: "Max Q", value: String(step.maxQueue) },
                                    { label: "Idle", value: fmt(step.idleTime || 0) },
                                  ] : [])
                                ].map(({ label, value }) => (
                                  <div key={label} className="px-2 py-1.5 bg-slate-50/60">
                                    <p className="text-[8px] text-slate-400 uppercase tracking-wide">{label}</p>
                                    <p className="text-[10px] font-semibold text-slate-700 tabular-nums mt-0.5">{value}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}