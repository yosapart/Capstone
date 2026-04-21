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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
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

  const fmt = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  
  const fmtCompact = (n: number) => {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  };

  const formatTime = (totalMins: number) => {
    if (totalMins < 60) return `${fmt(totalMins)} นาที`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (mins === 0) return `${hours} ชั่วโมง`;
    return `${hours} ชม. ${fmt(mins)} นาที`;
  };

  return (
    <aside className="w-[200px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setRightTab("your")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${rightTab === "your"
            ? "text-[#1594dd] border-b-2 border-[#1594dd]"
            : "text-gray-400 hover:text-gray-600"
            }`}
        >
          Your
        </button>
        <button
          onClick={() => setRightTab("result")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${rightTab === "result"
            ? "text-[#1594dd] border-b-2 border-[#1594dd]"
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
              <p className="text-gray-400 text-xs text-center mt-8">ยังไม่มี Block</p>
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
                        <div
                          className="w-3 h-3 rounded-sm border"
                          style={{ borderColor: bt?.border, backgroundColor: `${bt?.color}30` }}
                        />
                        <span className={`text-xs font-semibold text-[#34495e] ${block.type === "process" ? "hover:text-[#1594dd] transition-colors" : ""}`}>
                          {block.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">Step {block.step_order}</p>
                    </div>

                    {/* Trash Button showing on hover */}
                    {onDeleteBlock && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteBlock(block.block_id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 ml-2 shrink-0"
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
              <div className="text-center mt-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs">ยังไม่มีผลลัพธ์</p>
                <p className="text-gray-300 text-[10px] mt-1">กด ▶ Play เพื่อรัน Simulation</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-2.5 border border-blue-200/50">
                    <p className="text-[10px] text-blue-500 font-medium">💰 ต้นทุนรวม</p>
                    <p className={`text-sm font-bold mt-0.5 ${playbackState ? "text-blue-600 transition-all duration-300" : "text-[#34495e]"}`}>
                      {fmtCompact(playbackState ? playbackState.cost : simulationResult.total_cost)}
                    </p>
                    <p className="text-[9px] text-gray-400">บาท</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-2.5 border border-amber-200/50">
                    <p className="text-[10px] text-amber-600 font-medium">⚡ ค่าไฟรวม</p>
                    <p className={`text-sm font-bold mt-0.5 ${playbackState ? "text-amber-600 transition-all duration-300" : "text-[#34495e]"}`}>
                      {fmtCompact(playbackState ? playbackState.electricity : simulationResult.total_electricity)}
                    </p>
                    <p className="text-[9px] text-gray-400">หน่วย</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-2.5 border border-green-200/50">
                    <p className="text-[10px] text-green-600 font-medium">⏱️ เวลารวม</p>
                    <p className={`text-[12px] font-bold mt-0.5 ${playbackState ? "text-green-600 transition-all duration-300" : "text-[#34495e]"}`}>
                      {formatTime(playbackState ? playbackState.duration : simulationResult.total_duration)}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-2.5 border border-purple-200/50">
                    <p className="text-[10px] text-purple-600 font-medium">🎯 ผลิตได้</p>
                    <p className="text-sm font-bold text-[#34495e] mt-0.5 flex items-end gap-1">
                      {playbackState ? (
                        <span className="text-purple-600 transition-all">{fmtCompact(playbackState.currentProduce)}</span>
                      ) : (
                        <span>{fmtCompact(simulationResult.target_output)}</span>
                      )}

                      {playbackState && (
                        <span className="text-[10px] text-gray-500 font-normal mb-0.5">/ {fmtCompact(simulationResult.target_output)}</span>
                      )}
                    </p>
                    <p className="text-[9px] text-gray-400">ชิ้น</p>
                  </div>
                </div>

                {/* Financial Summary Cards (If selling price is set) */}
                {simulationResult.selling_price_per_unit && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg p-2.5 border border-indigo-200/50">
                      <p className="text-[10px] text-indigo-500 font-medium">💵 รายได้รวม</p>
                      <p className={`text-sm font-bold mt-0.5 ${playbackState ? "text-indigo-600 transition-all duration-300" : "text-[#34495e]"}`}>
                        {fmtCompact(playbackState ? (playbackState.revenue || 0) : (simulationResult.total_revenue || 0))}
                      </p>
                      <p className="text-[9px] text-gray-400">บาท</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-lg p-2.5 border border-emerald-200/50">
                      <p className="text-[10px] text-emerald-600 font-medium">📈 กำไรสุทธิ</p>
                      <p className={`text-sm font-bold mt-0.5 ${playbackState ? "text-emerald-600 transition-all duration-300" : "text-[#34495e]"}`}>
                        {fmtCompact(playbackState ? (playbackState.netProfit || 0) : (simulationResult.net_profit || 0))}
                      </p>
                      <p className="text-[9px] text-gray-400">บาท</p>
                    </div>
                  </div>
                )}

                {/* Steps Breakdown */}
                <div className="space-y-1.5 mt-2">
                  {simulationResult.steps.map((step, i) => {
                    const isStartEnd = step.type === "start" || step.type === "end";
                    const bt = BLOCK_TYPES.find((b) => b.type === step.type);

                    return (
                      <div
                        key={i}
                        className={`rounded-lg p-2 border text-xs transition-all ${step.skipped
                            ? "bg-red-50 border-red-200"
                            : isStartEnd
                              ? "bg-gray-50 border-gray-200"
                              : "bg-white border-gray-200 hover:shadow-sm"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-2.5 h-2.5 rounded-sm border"
                              style={{
                                borderColor: bt?.border || "#999",
                                backgroundColor: `${bt?.color || "#666"}30`,
                              }}
                            />
                            <span className="font-semibold text-[#34495e]">{step.name}</span>
                          </div>
                        </div>

                        {!isStartEnd && !step.skipped && (
                          <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px] text-gray-500">
                            <div>
                              <span className="text-gray-400">Cost</span>
                              <p className="font-semibold text-[#34495e]">{fmt(step.cost || 0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">ไฟฟ้า</span>
                              <p className="font-semibold text-[#34495e]">{fmt(step.electricity || 0)}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">เวลา</span>
                              <p className="font-semibold text-[#34495e]">{fmt(step.duration || 0)}</p>
                            </div>
                          </div>
                        )}

                        {!isStartEnd && !step.skipped && step.maxQueue !== undefined && (
                          <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex gap-3 text-[10px]">
                              <span className="text-gray-500">Queue Max: <b className="text-[#34495e]">{step.maxQueue}</b></span>
                              <span className="text-gray-500">Idle: <b className="text-[#34495e]">{fmt(step.idleTime || 0)}</b></span>
                            </div>
                            {step.isBottleneck && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[9px] font-bold shadow-sm animate-pulse border border-red-200">
                                ⚠️ Bottleneck
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
