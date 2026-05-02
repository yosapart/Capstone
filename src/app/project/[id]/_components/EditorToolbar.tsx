"use client";

import { useState, useRef, useEffect } from "react";
import { FlowData } from "./editorTypes";

interface EditorToolbarProps {
  flows: FlowData[];
  selectedFlowId: number | null;
  setSelectedFlowId: (id: number) => void;
  onNewFlow: () => void;
  onPlay: () => void;
  onStop?: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
  onDownloadPDF?: () => void;
  onAutoOptimize?: () => void;
}

export function EditorToolbar({
  flows,
  selectedFlowId,
  setSelectedFlowId,
  onNewFlow,
  onPlay,
  onStop,
  speed,
  setSpeed,
  onDownloadPDF,
  onAutoOptimize,
}: EditorToolbarProps) {
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const flowRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flowRef.current && !flowRef.current.contains(event.target as Node)) {
        setIsFlowOpen(false);
      }
      if (speedRef.current && !speedRef.current.contains(event.target as Node)) {
        setIsSpeedOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center h-[52px] bg-white border-b border-[#f0f0f0] px-5 gap-4 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-20">

      {/* Custom Flow Selector */}
      <div className="relative min-w-[140px]" ref={flowRef}>
        <button
          onClick={() => setIsFlowOpen(!isFlowOpen)}
          className={`w-full flex items-center justify-between bg-white border rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-gray-700 outline-none transition-all cursor-pointer ${isFlowOpen ? "border-[#8F9E8B] ring-[3px] ring-[#8F9E8B]/10" : "border-gray-200 hover:border-gray-300"
            }`}
        >
          <span className="truncate">
            {selectedFlowId
              ? (() => {
                const name = flows.find(f => f.flow_id === selectedFlowId)?.name || "Select Flow";
                return name.length > 10 ? name.substring(0, 10) + "..." : name;
              })()
              : "-- No Flow --"}
          </span>
          <svg className={`w-3.5 h-3.5 ml-2 text-gray-400 transition-transform ${isFlowOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </button>

        {isFlowOpen && (
          <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-1.5 z-50 max-h-[240px] overflow-y-auto">
            {flows.length === 0 && (
              <div className="px-3 py-2 text-[13px] text-gray-400 text-center">-- No Flow --</div>
            )}
            {flows.map((f) => (
              <button
                key={f.flow_id}
                onClick={() => {
                  setSelectedFlowId(f.flow_id);
                  setIsFlowOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors ${selectedFlowId === f.flow_id
                  ? "bg-[#8F9E8B]/15 text-[#5A6956] font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                {f.name.length > 10 ? f.name.substring(0, 10) + "..." : f.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onNewFlow}
        className="text-[13px] font-medium text-[#7A8B76] hover:text-[#5A6956] bg-[#7A8B76]/10 hover:bg-[#7A8B76]/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
      >
        <span>+</span> New Flow
      </button>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-gray-200" />



      {/* Play / Stop */}
      <div className="flex items-center gap-1.5">
        <button onClick={onPlay} className="p-1.5 text-gray-400 hover:text-[#4CAF50] hover:bg-[#4CAF50]/10 rounded-lg transition-all" title="Play">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
        </button>
        <button onClick={onStop} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Stop">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
        </button>
      </div>

      {/* Speed */}
      <div className="flex items-center gap-2 ml-2">
        <span className="text-[13px] font-medium text-gray-400">Speed</span>

        {/* Custom Speed Selector */}
        <div className="relative" ref={speedRef}>
          <button
            onClick={() => setIsSpeedOpen(!isSpeedOpen)}
            className={`w-[70px] flex items-center justify-between bg-white border rounded-[8px] px-2.5 py-1 text-[13px] font-medium text-gray-600 outline-none transition-all cursor-pointer ${isSpeedOpen ? "border-[#8F9E8B] ring-[3px] ring-[#8F9E8B]/10" : "border-gray-200 hover:border-gray-300"
              }`}
          >
            <span>{speed}x</span>
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isSpeedOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>

          {isSpeedOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-1.5 z-50">
              {[0.5, 1, 2, 4].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSpeed(v);
                    setIsSpeedOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-[13px] rounded-lg transition-colors ${speed === v
                    ? "bg-[#8F9E8B]/15 text-[#5A6956] font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                >
                  {v}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-4 bg-gray-200" />

      {/* Auto-Optimize Button */}
      <button
        onClick={onAutoOptimize}
        title="Auto-Optimization Solver"
        className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 px-3 py-1.5 rounded-xl transition-all"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        Optimize
      </button>

      <div className="flex-1" />

      {/* Save Flow + Download PDF */}
      <div className="flex items-center gap-3">
        <button
          onClick={onDownloadPDF}
          className="text-[13px] font-semibold text-gray-600 
  bg-white border border-gray-200 
  px-4 py-2 rounded-xl shadow-sm 
  transition-all duration-200

  hover:bg-blue-500 hover:border-blue-500 hover:text-white
  hover:shadow-[0_0_12px_rgba(59,130,246,0.5)]"
        >
          Download PDF
        </button>
      </div>
    </div>
  );
}
