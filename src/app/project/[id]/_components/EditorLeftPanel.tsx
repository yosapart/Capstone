"use client";

import { BLOCK_TYPES } from "./editorTypes";

interface EditorLeftPanelProps {
  onAddBlock: (type: string, label: string) => void;
}

export function EditorLeftPanel({ onAddBlock }: EditorLeftPanelProps) {
  return (
    <aside className="w-[85px] bg-white border-r border-gray-200 flex flex-col shrink-0 p-2.5 gap-4">      {/* Block palette */}
      <div className="grid grid-cols-1 gap-4 mt-4.5">
        {BLOCK_TYPES.map((bt) => (
          <button
            key={bt.type}
            onClick={() => onAddBlock(bt.type, bt.label)}
            className="flex flex-col items-center justify-center p-2.5 rounded-lg border-2 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
            style={{ borderColor: bt.border, backgroundColor: `${bt.color}15` }}
            title={bt.label}
          >
            <div
              className="w-8 h-8 rounded-md border-2"
              style={{ borderColor: bt.border, backgroundColor: `${bt.color}30` }}
            />
            <span className="text-[11px] font-semibold mt-1 text-gray-600 truncate w-full text-center">
              {bt.label}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
