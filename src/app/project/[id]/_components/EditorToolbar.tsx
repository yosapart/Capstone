"use client";

import { FlowData } from "./editorTypes";

interface EditorToolbarProps {
  flows: FlowData[];
  selectedFlowId: number | null;
  setSelectedFlowId: (id: number) => void;
  onNewFlow: () => void;
  speed: number;
  setSpeed: (speed: number) => void;
}

export function EditorToolbar({
  flows,
  selectedFlowId,
  setSelectedFlowId,
  onNewFlow,
  speed,
  setSpeed,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center h-[42px] bg-white border-b border-gray-200 px-4 gap-3 shrink-0">
      {/* Flow selector */}
      <select
        value={selectedFlowId ?? ""}
        onChange={(e) => setSelectedFlowId(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-3 py-1 text-sm text-[#34495e] outline-none focus:ring-2 focus:ring-[#1594dd] cursor-pointer"
      >
        {flows.length === 0 && <option value="">-- No Flow --</option>}
        {flows.map((f) => (
          <option key={f.flow_id} value={f.flow_id}>
            {f.name}
          </option>
        ))}
      </select>

      <button
        onClick={onNewFlow}
        className="text-xs font-semibold text-[#1594dd] hover:text-[#1277b5] transition-colors"
      >
        + New Flow
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-300" />

      {/* Undo / Redo */}
      <button className="p-1 text-gray-500 hover:text-[#34495e] transition-colors" title="Undo">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
      </button>
      <button className="p-1 text-gray-500 hover:text-[#34495e] transition-colors" title="Redo">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-300" />

      {/* Play / Stop */}
      <button className="p-1 text-gray-500 hover:text-green-600 transition-colors" title="Play">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>
      <button className="p-1 text-gray-500 hover:text-red-500 transition-colors" title="Stop">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
      </button>

      {/* Speed */}
      <span className="text-xs text-gray-500">Speed</span>
      <select
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
        className="border border-gray-300 rounded-md px-2 py-0.5 text-xs text-gray-600 outline-none cursor-pointer"
      >
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>

      <div className="flex-1" />

      {/* Save Flow + Download PDF */}
      <button className="text-xs font-semibold text-white bg-[#27ae60] px-4 py-1.5 rounded-md hover:bg-[#219a52] transition-colors">
        Save Flow
      </button>
      <button className="text-xs font-semibold text-white bg-[#2980b9] px-4 py-1.5 rounded-md hover:bg-[#2471a3] transition-colors">
        Download PDF
      </button>
    </div>
  );
}
