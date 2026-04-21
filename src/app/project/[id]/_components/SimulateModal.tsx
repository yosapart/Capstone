import { useState, useEffect, useRef } from "react";
import { TestcaseData, SimulationResult } from "./editorTypes";

interface SimulateModalProps {
  flowId: number;
  flowName: string;
  onClose: () => void;
  onResult: (result: SimulationResult) => void;
}

export function SimulateModal({ flowId, flowName, onClose, onResult }: SimulateModalProps) {
  const [testcases, setTestcases] = useState<TestcaseData[]>([]);
  const [targetOutput, setTargetOutput] = useState<number>(100);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"instant" | "realtime">("realtime");

  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const scenarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/testcases").then(res => res.json()).then(setTestcases).catch(console.error);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scenarioRef.current && !scenarioRef.current.contains(event.target as Node)) {
        setIsScenarioOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSimulate = async () => {
    if (targetOutput <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: flowId,
          target_output: targetOutput,
          testcase_id: selectedCaseId || null
        })
      });
      const resData = await res.json();
      const result: SimulationResult = resData.data;
      result.mode = mode;
      
      // Calculate Revenue and Profit
      if (sellingPrice > 0) {
        result.selling_price_per_unit = sellingPrice;
        result.total_revenue = sellingPrice * targetOutput;
        result.net_profit = result.total_revenue - result.total_cost;
      }

      onResult(result);
      onClose();
    } catch (error) {
      alert("Simulation failed");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedScenarioName = () => {
    if (selectedCaseId === 0) return "Standard Operation (Normal)";
    const tc = testcases.find(t => t.tc_id === selectedCaseId);
    return tc ? tc.name : "Standard Operation (Normal)";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-sm mx-4 rounded-2xl shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header - Simple & Clean */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Run Simulation</h2>
          <p className="text-sm text-slate-500 mt-1">Configuring <span className="text-slate-900 font-medium">{flowName}</span></p>
        </div>

        <div className="px-6 py-2 space-y-5">
          {/* Input Group */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600 ml-0.5">Target Output</label>
              <input
                type="number"
                min={1}
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-3 text-sm transition-all outline-none"
                value={targetOutput}
                onChange={(e) => setTargetOutput(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-600 ml-0.5">Selling Price / Unit</label>
              <input
                type="number"
                min={0}
                placeholder="Optional"
                className="w-full bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900 rounded-xl p-3 text-sm transition-all outline-none"
                value={sellingPrice || ""}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Mode Switcher - Segmented Control style */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-slate-600 ml-0.5">Visualization</label>
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMode("realtime")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${mode === "realtime" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Real-time
              </button>
              <button
                onClick={() => setMode("instant")}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${mode === "instant" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Instant
              </button>
            </div>
          </div>

          {/* Custom Test Case Select */}
          <div className="space-y-1.5 relative" ref={scenarioRef}>
            <label className="text-[13px] font-medium text-slate-600 ml-0.5">Scenario</label>
            <button
              onClick={() => setIsScenarioOpen(!isScenarioOpen)}
              className={`w-full flex items-center justify-between bg-slate-50 border-none ring-1 transition-all rounded-xl p-3 text-sm outline-none cursor-pointer ${isScenarioOpen ? "ring-2 ring-slate-900 bg-white" : "ring-slate-200 hover:ring-slate-300"
                }`}
            >
              <span className="text-slate-700 font-medium truncate">{getSelectedScenarioName()}</span>
              <svg className={`w-4 h-4 ml-2 text-slate-400 transition-transform ${isScenarioOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {isScenarioOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-100 rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-1.5 z-50 max-h-[200px] overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCaseId(0);
                    setIsScenarioOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-[13px] rounded-lg transition-colors ${selectedCaseId === 0
                      ? "bg-slate-100 text-slate-900 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                  Standard Operation (Normal)
                </button>
                {testcases.map(tc => (
                  <button
                    key={tc.tc_id}
                    onClick={() => {
                      setSelectedCaseId(tc.tc_id);
                      setIsScenarioOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-[13px] rounded-lg transition-colors ${selectedCaseId === tc.tc_id
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    {tc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 mt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex-[2] px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-slate-200 active:scale-[0.98]"
          >
            {loading ? "Processing..." : "Start Simulation"}
          </button>
        </div>
      </div>
    </div>
  );
}