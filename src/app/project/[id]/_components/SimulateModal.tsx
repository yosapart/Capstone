import { useState, useEffect, useRef } from "react";
import { TestcaseData, SimulationResult } from "./editorTypes";

interface SimulateModalProps {
  flowId: number;
  blocks: any[];
  flowName: string;
  onClose: () => void;
  onResult: (result: SimulationResult) => void;
  showToast: (message: string) => void;
}

export function SimulateModal({ flowId, blocks, flowName, onClose, onResult, showToast }: SimulateModalProps) {
  const [testcases, setTestcases] = useState<TestcaseData[]>([]);
  const [targetOutput, setTargetOutput] = useState<number | "">("");
  const [sellingPrice, setSellingPrice] = useState<number | "">("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">("");
  const [selectedCaseId, setSelectedCaseId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"instant" | "realtime">("realtime");

  const [isScenarioOpen, setIsScenarioOpen] = useState(false);
  const scenarioRef = useRef<HTMLDivElement>(null);

  const labelClassName = "text-[13px] font-bold text-slate-500 uppercase tracking-wide ml-0.5";

  const isFormIncomplete = targetOutput === "" || Number(targetOutput) <= 0;

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
    if (isFormIncomplete) return;

    const finalTargetOutput = Number(targetOutput);
    const finalTimeLimit = Number(timeLimitMinutes) || 0;
    const finalSellingPrice = Number(sellingPrice) || 0;

    setLoading(true);
    try {
      const res = await fetch("/api/simulations/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow_id: flowId,
          target_output: finalTargetOutput,
          testcase_id: selectedCaseId || null
        })
      });
      const resData = await res.json();
      const result: SimulationResult = resData.data;
      result.mode = mode;
      
      // Calculate Revenue, Opportunity Gain, Penalty, and Net Profit
      if (finalSellingPrice > 0) {
        result.selling_price_per_unit = finalSellingPrice;
        result.total_revenue = finalSellingPrice * finalTargetOutput;
        
        // Exact formula matching optimizer.engine.ts
        const timeSaved = Math.max(0, finalTimeLimit - result.total_duration);
        const throughputRate = result.total_duration > 0 ? finalTargetOutput / result.total_duration : 0;
        
        const totalMaterialCostPerUnit = blocks.reduce((sum, b) => sum + (Number(b.cost_per_unit) || 0), 0);
        const marginalProfitPerUnit = finalSellingPrice - totalMaterialCostPerUnit;
        const rawOpportunityGain = finalSellingPrice > 0 && marginalProfitPerUnit > 0
          ? timeSaved * throughputRate * marginalProfitPerUnit
          : 0;
        const maxOpportunityGain = finalTimeLimit > 0
          ? (timeSaved / finalTimeLimit) * result.total_revenue
          : 0;
        const opportunityGain = Math.min(rawOpportunityGain, maxOpportunityGain);
        
        const overdueMinutes = Math.max(0, result.total_duration - finalTimeLimit);
        const overdueHours = overdueMinutes / 60;
        const overduePenalty = overdueHours * 0.005 * result.total_revenue; // 0.5% per hour default
        
        result.net_profit = result.total_revenue + opportunityGain - result.total_cost - overduePenalty;
        result.time_limit_minutes = finalTimeLimit;
        result.opportunity_gain = opportunityGain;
        result.overdue_penalty = overduePenalty;
      }

      onResult(result);
      onClose();
    } catch (error) {
      showToast("Simulation failed. Please check your connection.");
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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/20 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md mx-4 rounded-2xl shadow-2xl border border-slate-100 relative"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header - Simple & Clean */}
        <div className="px-6 pt-6 pb-4">
          <h2 className="text-[22px] font-semibold text-slate-800 tracking-tight">Run Simulation</h2>
          <p className="text-[16px] text-slate-500 mt-1">Configuring <span className="text-slate-900 font-medium">{flowName}</span></p>
        </div>

        <div className="px-6 py-2 space-y-5">
          {/* Input Group */}
          <div className="space-y-4">
            {/* Target Output - Primary Setting */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={labelClassName}>Target Output</label>
                <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Required
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  placeholder="100"
                  className={`w-full bg-white border border-slate-200 focus:border-[#5d88bd] focus:ring-2 focus:ring-[#5d88bd]/20 rounded-xl p-3.5 pl-4 text-[15px] font-semibold text-slate-800 transition-all outline-none shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-slate-300`}
                  value={targetOutput}
                  onChange={(e) => setTargetOutput(e.target.value === "" ? "" : Number(e.target.value))}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-medium pointer-events-none text-slate-400">
                  PCS
                </span>
              </div>
            </div>

            {/* Business Constraints - Secondary Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelClassName}>Time Limit</label>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    placeholder="480"
                    className="w-full bg-white border border-slate-200 focus:border-[#5d88bd] focus:ring-2 focus:ring-[#5d88bd]/20 rounded-xl p-3.5 pl-4 text-[15px] font-semibold text-slate-800 transition-all outline-none shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-slate-300"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-medium pointer-events-none">
                    MIN
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={labelClassName}>Selling Price</label>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    placeholder="150"
                    className="w-full bg-white border border-slate-200 focus:border-[#5d88bd] focus:ring-2 focus:ring-[#5d88bd]/20 rounded-xl p-3.5 pl-4 text-[15px] font-semibold text-slate-800 transition-all outline-none shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-slate-300"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-medium pointer-events-none">
                    THB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Switcher - Segmented Control style */}
          <div className="space-y-1.5">
            <label className={labelClassName}>Visualization</label>
            <div className="flex p-1 mt-1.5 bg-slate-100 rounded-xl">
              <button
                onClick={() => setMode("realtime")}
                className={`flex-1 py-2 text-[13px] cursor-pointer font-medium rounded-lg transition-all ${mode === "realtime" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Real-time
              </button>
              <button
                onClick={() => setMode("instant")}
                className={`flex-1 py-2 text-[13px] cursor-pointer font-medium rounded-lg transition-all ${mode === "instant" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Instant
              </button>
            </div>
          </div>

          {/* Custom Test Case Select */}
          <div className="space-y-1.5 relative" ref={scenarioRef}>
            <label className={labelClassName}>Scenario</label>
            <button
              onClick={() => setIsScenarioOpen(!isScenarioOpen)}
              className={`w-full mt-2 flex items-center justify-between bg-slate-50 border-none ring-1 transition-all rounded-xl p-3 text-sm outline-none cursor-pointer ${isScenarioOpen ? "ring-2 ring-slate-900 bg-white" : "ring-slate-200 hover:ring-slate-300"
                }`}
            >
              <span className="text-slate-700 font-medium truncate">{getSelectedScenarioName()}</span>
              <svg className={`w-4 h-4 ml-2 text-slate-400 transition-transform ${isScenarioOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {isScenarioOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-slate-100 rounded-[14px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-1.5 z-50 max-h-50 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedCaseId(0);
                    setIsScenarioOpen(false);
                  }}
                  className={`w-full cursor-pointer text-left px-3 py-2.5 text-[13px] rounded-lg transition-colors ${selectedCaseId === 0
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
                    className={`w-full cursor-pointer text-left px-3 py-2.5 text-[13px] rounded-lg transition-colors ${selectedCaseId === tc.tc_id
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
            className="flex-1 px-4 py-3 text-sm font-medium text-slate-600 cursor-pointer hover:bg-slate-50 rounded-xl transition"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSimulate}
            disabled={isFormIncomplete || loading}
            className={`flex-2 px-4 py-3 text-white text-sm font-semibold rounded-xl transition-all ${
              isFormIncomplete || loading
                ? "bg-slate-300 cursor-not-allowed opacity-70"
                : "bg-slate-900 cursor-pointer hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-[0.98]"
            }`}
          >
            {loading ? "Processing..." : "Start Simulation"}
          </button>
        </div>
      </div>
    </div>
  );
}