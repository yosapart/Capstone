/**
 * Quick test script for the optimizer engine
 * Run with: npx tsx scratch/test-optimizer.ts
 */

import {
  runProfitOptimizer,
  compareAllStrategies,
  ProcessBlock,
} from "../src/services/optimizer.engine";

// ─── Test Data: 3 Process Blocks (similar to screenshot values) ───
const blocks: ProcessBlock[] = [
  {
    block_id: 1, name: "Mixing", step_order: 1,
    duration: 10, people: 2, cost_per_person: 400,
    cost_per_unit: 10, electricity_per_unit: 10,
  },
  {
    block_id: 2, name: "Heating", step_order: 2,
    duration: 15, people: 3, cost_per_person: 500,
    cost_per_unit: 15, electricity_per_unit: 8,
  },
  {
    block_id: 3, name: "Packaging", step_order: 3,
    duration: 8, people: 2, cost_per_person: 350,
    cost_per_unit: 5, electricity_per_unit: 5,
  },
];

function printResult(label: string, res: any) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Total Time:        ${res.totalTime.toFixed(1)} mins`);
  console.log(`  Within Time Limit: ${res.withinTimeLimit}`);
  console.log(`  Time Saved:        ${res.timeSaved.toFixed(1)} mins`);
  console.log(`  ─── Costs ───`);
  console.log(`  Labor Cost:        ${res.laborCost.toFixed(0)} ฿`);
  console.log(`  Material Cost:     ${res.materialCost.toFixed(0)} ฿`);
  console.log(`  Electricity Cost:  ${res.electricityCost.toFixed(0)} ฿`);
  console.log(`  Total Cost:        ${res.totalCost.toFixed(0)} ฿`);
  console.log(`  ─── Revenue ───`);
  console.log(`  Revenue:           ${res.revenue.toFixed(0)} ฿`);
  console.log(`  Opportunity Gain:  ${res.opportunityGain.toFixed(0)} ฿`);
  console.log(`  Overdue Penalty:   ${res.overduePenalty.toFixed(0)} ฿`);
  console.log(`  ─── Profit ───`);
  console.log(`  Net Profit:        ${res.netProfit.toFixed(0)} ฿  ${res.netProfit >= 0 ? "✅ PROFIT" : "❌ LOSS"}`);
  console.log(`  Stop Reason:       ${res.stopReason}`);
  console.log(`  ─── Workers ───`);
  res.allocations.forEach((a: any) => {
    const diff = a.suggestedPeople - a.originalPeople;
    const arrow = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "=";
    console.log(`  ${a.name}: ${a.originalPeople} → ${a.suggestedPeople} (${arrow})`);
  });
}

// ─── Test 1: Reasonable selling price, tight deadline ───
console.log("\n\n🔬 TEST 1: Selling Price = 250, Target = 100, Time Limit = 60 min");
const cmp1 = compareAllStrategies(blocks, {
  targetUnits: 100,
  timeLimitMinutes: 60,
  sellingPricePerUnit: 250,
});
printResult("Fastest Time", cmp1.time);
printResult("Lowest Cost", cmp1.cost);
printResult("Max Profit", cmp1.profit);

// ─── Test 2: High selling price, loose deadline ───
console.log("\n\n🔬 TEST 2: Selling Price = 500, Target = 100, Time Limit = 600 min");
const cmp2 = compareAllStrategies(blocks, {
  targetUnits: 100,
  timeLimitMinutes: 600,
  sellingPricePerUnit: 500,
});
printResult("Fastest Time", cmp2.time);
printResult("Lowest Cost", cmp2.cost);
printResult("Max Profit", cmp2.profit);

// ─── Test 3: Low selling price ───
console.log("\n\n🔬 TEST 3: Selling Price = 50, Target = 100, Time Limit = 600 min");
const cmp3 = compareAllStrategies(blocks, {
  targetUnits: 100,
  timeLimitMinutes: 600,
  sellingPricePerUnit: 50,
});
printResult("Fastest Time", cmp3.time);
printResult("Lowest Cost", cmp3.cost);
printResult("Max Profit", cmp3.profit);

// ─── Test 4: Debug — manual cost breakdown for a single block ───
console.log("\n\n🔬 TEST 4: Manual Cost Breakdown (single block, 1 person)");
const singleBlock: ProcessBlock[] = [{
  block_id: 1, name: "Test", step_order: 1,
  duration: 10, people: 1, cost_per_person: 400,
  cost_per_unit: 10, electricity_per_unit: 10,
}];

const single = runProfitOptimizer(singleBlock, {
  targetUnits: 100, timeLimitMinutes: 600,
  sellingPricePerUnit: 200, mode: "profit",
});
printResult("Single Block - Max Profit", single);

// Manual verification
console.log("\n  ─── Manual Verification ───");
const effDur = 10 / single.allocations[0].suggestedPeople;
const totalTime = effDur * 100;
console.log(`  Effective duration: ${effDur} min/unit`);
console.log(`  Total time: ${totalTime} min`);
const wage = 400 / 480;
const laborManual = single.allocations[0].suggestedPeople * wage * totalTime;
console.log(`  Labor (manual): ${laborManual.toFixed(0)} ฿`);
const matManual = 10 * 100;
console.log(`  Material (manual): ${matManual} ฿`);
const elecManual = (10 * 100) + ((10/10) * totalTime);
console.log(`  Electricity (manual): ${elecManual.toFixed(0)} ฿`);
const totalCostManual = laborManual + matManual + elecManual;
console.log(`  Total cost (manual): ${totalCostManual.toFixed(0)} ฿`);
const revenueManual = 100 * 200;
console.log(`  Revenue (manual): ${revenueManual} ฿`);
console.log(`  Net profit (before opp/penalty): ${(revenueManual - totalCostManual).toFixed(0)} ฿`);

// ─── Test 5: Excess workers in non-bottleneck ───
console.log("\n\n🔬 TEST 5: Excess Workers (Lowest Cost should reduce Packaging)");
const overstaffedBlocks: ProcessBlock[] = [
  { ...blocks[0], people: 2 }, // effDur = 10/2 = 5
  { ...blocks[1], people: 3 }, // effDur = 15/3 = 5 (Bottleneck)
  { ...blocks[2], people: 10 }, // effDur = 8/10 = 0.8 (Excessive!)
];
const cmp5 = compareAllStrategies(overstaffedBlocks, {
  targetUnits: 100,
  timeLimitMinutes: 600,
  sellingPricePerUnit: 250,
});
printResult("Lowest Cost (Excess Test)", cmp5.cost);
