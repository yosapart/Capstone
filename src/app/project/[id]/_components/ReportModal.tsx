import { SimulationResult } from "./editorTypes";
import { useEffect } from "react";

interface ReportModalProps {
  projectName: string;
  flowName: string;
  simulationResult: SimulationResult;
  authorName: string;
  onClose: () => void;
}

export function ReportModal({ projectName, flowName, simulationResult, authorName, onClose }: ReportModalProps) {
  
  const fmt = (val: number) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const formatTime = (totalMins: number) => {
    if (totalMins < 60) return `${fmt(totalMins)} Minutes`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (mins === 0) return `${hours} Hours`;
    return `${hours} Hours ${fmt(mins)} Minutes`;
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex justify-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible">
      {/* ─── Web Controls (Hidden during print) ─── */}
      <div className="fixed top-6 right-6 flex gap-3 print:hidden z-50">
        <button 
          onClick={onClose}
          className="px-5 py-2.5 bg-white text-slate-700 font-semibold rounded shadow border border-slate-300 hover:bg-slate-50 transition"
        >
          Close
        </button>
        <button 
          onClick={handlePrint}
          className="px-5 py-2.5 bg-[#1594dd] text-white font-bold rounded shadow hover:bg-[#1277b5] transition flex items-center gap-2"
        >
          Save PDF
        </button>
      </div>

      {/* ─── Printable Document ─── */}
      <div className="bg-white w-full max-w-[21cm] min-h-[29.7cm] my-12 p-[2cm] shadow-xl text-black font-sans print:m-0 print:p-[1.5cm] print:shadow-none print:w-full">
        
        {/* Document Header */}
        <div className="text-center border-b-2 border-black pb-4 mb-8">
          <h1 className="text-2xl font-bold uppercase mb-2">Simulation Analysis Report</h1>
          <p className="text-sm">Factory Simulation Project</p>
        </div>

        {/* 1. General Information */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">1. General Information</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1 font-semibold w-1/3">Project Name:</td>
                <td className="py-1">{projectName}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold w-1/3">Flow Name:</td>
                <td className="py-1">{flowName}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold w-1/3">Date Generated:</td>
                <td className="py-1">{new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td className="py-1 font-semibold w-1/3">Testcase Applied:</td>
                <td className="py-1">
                  {simulationResult.testcase !== "none" ? simulationResult.testcase : "Standard Operation"}
                </td>
              </tr>
              {simulationResult.testcase_detail && (
                <tr>
                  <td className="py-1 font-semibold w-1/3 align-top">Testcase Description:</td>
                  <td className="py-1">{simulationResult.testcase_detail}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 2. Executive Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">2. Executive Summary</h2>
          <table className="w-full text-sm border-collapse border border-gray-800">
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Target Output</td>
                <td className="py-2 px-3">{simulationResult.target_output} units</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Total Cost</td>
                <td className="py-2 px-3">{fmt(simulationResult.total_cost)} Baht</td>
              </tr>
              {simulationResult.selling_price_per_unit && (
                <>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Selling Price</td>
                    <td className="py-2 px-3">{fmt(simulationResult.selling_price_per_unit)} Baht / unit</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Total Revenue</td>
                    <td className="py-2 px-3">{fmt(simulationResult.total_revenue || 0)} Baht</td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Net Profit</td>
                    <td className="py-2 px-3">{fmt(simulationResult.net_profit || 0)} Baht</td>
                  </tr>
                </>
              )}
              <tr className="border-b border-gray-800">
                <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Total Electricity</td>
                <td className="py-2 px-3">{fmt(simulationResult.total_electricity)} Units</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Total Duration</td>
                <td className="py-2 px-3">{formatTime(simulationResult.total_duration)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Bottleneck Analysis */}
        {simulationResult.bottleneck_step_order && (
          <div className="mb-6">
            <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">3. Bottleneck Identification</h2>
            <div className="p-4 border border-black bg-gray-50 text-sm">
              <p className="font-bold mb-1">Alert: Process Bottleneck Detected</p>
              <p>The simulation engine identified <strong>Step {simulationResult.bottleneck_step_order}</strong> as the primary bottleneck in the production flow. This station experienced the highest accumulation of queue waiting times.</p>
            </div>
          </div>
        )}

        {/* 4. Detailed Step Breakdown */}
        <div className="mb-8">
          <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">4. Step-by-Step Breakdown</h2>
          <table className="w-full text-sm border-collapse border border-black">
            <thead className="bg-gray-200">
              <tr>
                <th className="border border-black px-2 py-2 text-left">Step</th>
                <th className="border border-black px-2 py-2 text-left">Name</th>
                <th className="border border-black px-2 py-2 text-right">Cost (Baht)</th>
                <th className="border border-black px-2 py-2 text-right">Elec (Units)</th>
                <th className="border border-black px-2 py-2 text-right">Duration (m)</th>
                <th className="border border-black px-2 py-2 text-right">Max Queue</th>
              </tr>
            </thead>
            <tbody>
              {simulationResult.steps.map((step, idx) => (
                <tr key={idx}>
                  <td className="border border-black px-2 py-1 text-center">{step.step_order}</td>
                  <td className="border border-black px-2 py-1 break-all min-w-[150px]">
                    {step.name} 
                    {step.type === "start" ? " (Start)" : step.type === "end" ? " (End)" : ""}
                  </td>
                  <td className="border border-black px-2 py-1 text-right">{step.cost !== undefined ? fmt(step.cost) : "-"}</td>
                  <td className="border border-black px-2 py-1 text-right">{step.electricity !== undefined ? fmt(step.electricity) : "-"}</td>
                  <td className="border border-black px-2 py-1 text-right">{step.duration !== undefined ? fmt(step.duration) : "-"}</td>
                  <td className="border border-black px-2 py-1 text-right">{step.maxQueue !== undefined ? step.maxQueue : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Signature */}
        <div className="mt-16 flex justify-center text-sm pb-8">
          <div className="text-center">
            <div className="border-b border-black w-64 mb-2"></div>
            <p>Prepared By {authorName}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
