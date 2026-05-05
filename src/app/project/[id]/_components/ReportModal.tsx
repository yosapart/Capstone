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
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const styleTags = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(tag => tag.outerHTML)
        .join('');

      const content = document.getElementById('report-printable-area')?.innerHTML || '';

      printWindow.document.write(`
        <html>
          <head>
            <title>Simulation Report</title>
            ${styleTags}
            <style>
              @media print {
                @page { size: A4; margin: 0; }
                body { background: white !important; margin: 0 !important; padding: 0 !important; }
                
                #report-printable-area { 
                  display: block !important; 
                  width: 21cm !important;
                  margin: 0 auto !important;
                  float: none !important;
                }

                .paper-sheet { 
                  display: flex !important;
                  flex-direction: column !important;
                  margin: 0 !important; 
                  padding: 2cm !important;
                  width: 21cm !important;
                  /* Removed min-height to prevent accidental overflow */
                  height: 29.6cm !important;
                  overflow: hidden !important; 
                  box-shadow: none !important; 
                  page-break-after: always !important; 
                  break-after: page !important;
                  border: none !important;
                }

                .paper-sheet:last-child {
                  page-break-after: auto !important;
                  break-after: auto !important;
                }
                
                .print-hide { display: none !important; }
              }
              body { background: white !important; margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            <div id="report-printable-area">
              ${content}
            </div>
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 700);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // ─── Pagination Logic ───
  // Extremely conservative counts to ensure no overflow on any browser
  const ROWS_PER_PAGE_FIRST = 5;
  const ROWS_PER_PAGE_OTHER = 10;

  const steps = simulationResult.steps || [];
  const pageChunks: (typeof steps)[] = [];

  if (steps.length <= ROWS_PER_PAGE_FIRST) {
    pageChunks.push(steps);
  } else {
    pageChunks.push(steps.slice(0, ROWS_PER_PAGE_FIRST));
    let remaining = steps.slice(ROWS_PER_PAGE_FIRST);
    while (remaining.length > 0) {
      pageChunks.push(remaining.slice(0, ROWS_PER_PAGE_OTHER));
      remaining = remaining.slice(ROWS_PER_PAGE_OTHER);
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col items-center bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:bg-white print:block">
      
      {/* ─── Web Controls (Fixed Top Right) ─── */}
      <div className="fixed top-8 right-8 flex gap-3 z-[3100] print:hidden">
        <button 
          onClick={onClose}
          className="px-6 py-2.5 cursor-pointer bg-white text-slate-700 font-semibold rounded-full shadow-xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
        >
          Close
        </button>
        <button 
          onClick={handlePrint}
          className="px-6 py-2.5 cursor-pointer bg-[#1594dd] text-white font-bold rounded-full shadow-xl hover:bg-[#1277b5] transition-all flex items-center gap-2 active:scale-95"
        >
          Save PDF
        </button>
      </div>

      <style>{`
        @media screen {
          .paper-sheet {
            background: white;
            width: 21cm;
            min-height: 29.7cm;
            padding: 2cm;
            margin-bottom: 2rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            color: black;
            font-family: sans-serif;
          }
        }
      `}</style>

      {/* ─── Render Pages ─── */}
      <div id="report-printable-area" className="flex flex-col items-center w-full">
        {pageChunks.map((chunk, pageIdx) => (
          <div key={pageIdx} className="paper-sheet">
            
            {/* Main Content Area */}
            <div className="flex-1">
              {/* Header Only on Page 1 */}
              {pageIdx === 0 && (
                <>
                  <div className="text-center border-b-2 border-black pb-4 mb-8">
                    <h1 className="text-2xl font-bold uppercase mb-2">Simulation Analysis Report</h1>
                    <p className="text-sm">Factory Simulation Project</p>
                  </div>

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
                      </tbody>
                    </table>
                  </div>

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
                          <td className="py-2 px-3">{fmt(simulationResult.total_electricity || 0)} Units</td>
                        </tr>
                        <tr className="border-b border-gray-800">
                          <td className="py-2 px-3 border-r border-gray-800 font-semibold w-1/2">Total Duration</td>
                          <td className="py-2 px-3">{formatTime(simulationResult.total_duration)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {simulationResult.bottleneck_step_order && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">3. Bottleneck Identification</h2>
                      <div className="p-4 border border-black bg-gray-50 text-sm">
                        <p className="font-bold mb-1">Alert: Process Bottleneck Detected</p>
                        <p>The simulation engine identified <strong>Step {simulationResult.bottleneck_step_order}</strong> as the primary bottleneck.</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold border-b border-gray-400 mb-3 pb-1">
                  4. Step-by-Step Breakdown {pageIdx > 0 ? `(Continued - Page ${pageIdx + 1})` : ''}
                </h2>
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-black px-2 py-2 text-left w-12">Step</th>
                      <th className="border border-black px-2 py-2 text-left">Name</th>
                      <th className="border border-black px-2 py-2 text-right">Cost (Baht)</th>
                      <th className="border border-black px-2 py-2 text-right">Elec (Units)</th>
                      <th className="border border-black px-2 py-2 text-right w-24">Duration (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((step, idx) => (
                      <tr key={idx}>
                        <td className="border border-black px-2 py-1 text-center">{step.step_order}</td>
                        <td className="border border-black px-2 py-1 break-all">
                          {step.name} {step.type === "start" ? "(Start)" : step.type === "end" ? "(End)" : ""}
                        </td>
                        <td className="border border-black px-2 py-1 text-right">{step.cost !== undefined ? fmt(step.cost) : "-"}</td>
                        <td className="border border-black px-2 py-1 text-right">{step.electricity !== undefined ? fmt(step.electricity) : "-"}</td>
                        <td className="border border-black px-2 py-1 text-right">{step.duration !== undefined ? fmt(step.duration) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Spacer to push footer to bottom */}
            <div className="flex-grow"></div>

            {/* Footer Area (Now part of normal flow, pushed by flex-grow) */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-end">
              <div className="flex flex-col items-center flex-1 ml-20">
                {pageIdx === pageChunks.length - 1 && (
                  <>
                    <div className="border-t border-black w-48 mb-2"></div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Prepared By</p>
                    <p className="text-sm font-bold">{authorName}</p>
                  </>
                )}
              </div>
              <div className="text-[10px] text-gray-400 font-mono w-20 text-right">
                PAGE {pageIdx + 1} / {pageChunks.length}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
