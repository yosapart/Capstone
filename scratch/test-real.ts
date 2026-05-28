import { runProfitOptimizer } from '../src/services/optimizer.engine';
import { calculateSimulation } from '../src/services/simulation.engine';
import fs from 'fs';

const blocks = [
  { block_id: 1, step_order: 1, type: 'start', name: 'Start', cost_per_unit: 0, electricity_per_unit: 0, people: 0, cost_per_person: 0, duration: 0 },
  { block_id: 2, step_order: 2, type: 'process', name: 'Cutting', cost_per_unit: 10, electricity_per_unit: 2, people: 7, cost_per_person: 300, duration: 10 },
  { block_id: 3, step_order: 3, type: 'process', name: 'Sewing', cost_per_unit: 38, electricity_per_unit: 11.8, people: 50, cost_per_person: 300, duration: 15 },
  { block_id: 4, step_order: 4, type: 'end', name: 'End', cost_per_unit: 0, electricity_per_unit: 0, people: 0, cost_per_person: 0, duration: 0 },
];

const targetUnits = 100;
const simOutput = calculateSimulation(blocks, targetUnits, null);
console.log("Sim Total Elec:", simOutput.total_electricity, "Sim Total Cost:", simOutput.total_cost, "Sim Clock:", simOutput.total_duration);

const optOutput = runProfitOptimizer(blocks.filter(b => b.type === "process"), {
  targetUnits,
  timeLimitMinutes: 480,
  sellingPricePerUnit: 150,
  mode: "compare"
});
console.log("Opt Total Elec:", optOutput.electricityCost / 4, "Opt Total Cost:", optOutput.totalCost, "Opt Time:", optOutput.totalTime, "Opt Profit:", optOutput.netProfit);
