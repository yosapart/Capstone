"use client";

import { BlockData, BLOCK_TYPES } from "./editorTypes";
import { useState, useEffect, useRef } from "react";

interface EditorRightPanelProps {
  blocks: BlockData[];
  onDeleteBlock?: (blockId: number) => void;
  onEditBlock?: (blockId: number) => void;
  onReorderBlocks?: (newBlocks: BlockData[]) => void;
}

export function EditorRightPanel({ blocks, onDeleteBlock, onEditBlock, onReorderBlocks }: EditorRightPanelProps) {
  const [rightTab, setRightTab] = useState<"your" | "result">("your");

  // Local state for Drag and drop
  const [localBlocks, setLocalBlocks] = useState<BlockData[]>(blocks);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

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

  return (
    <aside className="w-[200px] bg-white border-l border-gray-200 flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => setRightTab("your")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
            rightTab === "your"
              ? "text-[#1594dd] border-b-2 border-[#1594dd]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Your
        </button>
        <button
          onClick={() => setRightTab("result")}
          className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
            rightTab === "result"
              ? "text-[#1594dd] border-b-2 border-[#1594dd]"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Result
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {rightTab === "your" ? (
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
        ) : (
          <div className="text-center mt-8">
            <p className="text-gray-400 text-xs">ยังไม่มีผลลัพธ์</p>
            <p className="text-gray-300 text-[10px] mt-1">กด Play เพื่อรัน Simulation</p>
          </div>
        )}
      </div>
    </aside>
  );
}
