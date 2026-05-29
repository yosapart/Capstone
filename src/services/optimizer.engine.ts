/**
 * Factory Profit Optimizer Engine (Realistic Industrial Management)
 * ==================================================================
 * A realistic economic optimizer that maximizes net profit by considering:
 * - Dynamic labor cost (based on actual production time)
 * - Dynamic electricity cost (proportional to machine run time)
 * - Material cost (per unit produced)
 * - Opportunity Gain from finishing early (extra throughput revenue)
 * - Overdue Penalty for exceeding deadline
 * - Bidirectional workforce adjustment (add & reduce from current staff)
 * - Budget constraints
 * - Multiple strategy modes
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ProcessBlock {
  block_id: number;
  name: string;
  step_order: number;
  duration: number;             // minutes per unit (at 1 person)
  people: number;              // current worker count
  cost_per_person: number;     // labor cost per day (480 min workday)
  cost_per_unit: number;       // material cost per unit produced
  electricity_per_unit: number; // electricity baht per unit produced (fixed)
  // NOTE: electricity cost also has a TIME component:
  // each machine running 1 minute consumes electricity_per_unit/duration baht/min
  // This creates a real trade-off: more workers = faster = less electricity bill
}

export interface OptimizerConfig {
  targetUnits: number;        // how many units to produce
  timeLimitMinutes: number;   // max allowed total time
  sellingPricePerUnit: number; // revenue per unit sold
  budget?: number;            // optional max spend budget (0 = unlimited)
  electricityCostPerUnit?: number; // baht per electricity unit (default 4)
  overduePenaltyRate?: number; // penalty rate per hour overdue (default 0.005 = 0.5%/hr of revenue)
  mode: "time" | "cost" | "profit";
}

export interface BlockAllocation {
  block_id: number;
  name: string;
  step_order: number;
  originalPeople: number;
  suggestedPeople: number;
  effectiveDuration: number;  // actual duration with suggested people
  laborCost: number;
  materialCost: number;
  electricityCost: number;
  totalBlockCost: number;
}

export interface OptimizerResult {
  allocations: BlockAllocation[];
  totalTime: number;        // minutes
  laborCost: number;
  materialCost: number;
  electricityCost: number;
  totalCost: number;
  revenue: number;
  netProfit: number;
  opportunityGain: number;  // extra revenue from finishing early (minus material cost)
  overduePenalty: number;   // penalty cost from exceeding deadline
  timeSaved: number;        // minutes saved vs deadline (0 if over)
  budgetUsed: number;
  withinBudget: boolean;
  withinTimeLimit: boolean;
  earlyStop: boolean;
  stopReason: string;
}

// ─────────────────────────────────────────────
// Core Calculations
// ─────────────────────────────────────────────

const WORKDAY_MINUTES = 480; // 8-hour workday
const DEFAULT_ELEC_COST_PER_UNIT = 4; // baht per electricity unit
const DEFAULT_OVERDUE_PENALTY_RATE = 0.005; // 0.5% of revenue per hour overdue
const MAX_PEOPLE_PER_BLOCK = 50; // realistic upper bound for workers per station

/**
 * Effective duration — matches simulation.engine.ts exactly.
 * Formula: duration / people  (linear, same as DES engine)
 * This ensures optimizer predictions match actual simulation results.
 */
function effectiveDuration(block: ProcessBlock, people: number): number {
  if (people <= 0) return Infinity;
  return block.duration / people;
}

/**
 * Compute per-block costs given an allocation
 */
function computeBlockCost(
  block: ProcessBlock,
  people: number,
  totalTime: number,
  targetUnits: number,
  electricityCostPerUnit: number
): { laborCost: number; materialCost: number; electricityCost: number; total: number } {
  const wage_per_minute = block.cost_per_person / WORKDAY_MINUTES;
  const laborCost = people * wage_per_minute * totalTime;
  const materialCost = block.cost_per_unit * targetUnits;

  // Electricity has TWO components:
  // 1. Fixed: electricity_per_unit × units × electricityCostPerUnit
  // 2. Time-based: electricity_per_unit/duration × totalTime × electricityCostPerUnit
  //    → More workers = faster production = less time = lower electricity bill
  //    → This creates a real trade-off between labor and electricity cost
  const elecPerMinute = block.duration > 0 ? (block.electricity_per_unit / block.duration) : 0;
  const electricityCost = ((block.electricity_per_unit * targetUnits) + (elecPerMinute * totalTime)) * electricityCostPerUnit;

  return {
    laborCost,
    materialCost,
    electricityCost,
    total: laborCost + materialCost + electricityCost,
  };
}

/**
 * Compute total time from worker allocations using Pipeline formula (Makespan in Flow Shop).
 * Total Time = Flow Time (time for first unit to pass all stations) + (N - 1) * Bottleneck Cycle Time
 */
function computeTotalTime(blocks: ProcessBlock[], peopleAlloc: number[], targetUnits: number): number {
  if (targetUnits <= 0 || blocks.length === 0) return 0;
  const effDurs = blocks.map((b, i) => effectiveDuration(b, peopleAlloc[i]));
  const flowTime = effDurs.reduce((sum, dur) => sum + dur, 0);
  const bottleneckDur = Math.max(...effDurs);
  return flowTime + (targetUnits - 1) * bottleneckDur;
}

/**
 * Compute full economic snapshot from current allocation.
 * Includes Opportunity Gain (early finish bonus) and Overdue Penalty.
 *
 * Opportunity Gain = timeSaved × throughputRate × (sellingPrice - materialCostPerUnit)
 *   → If factory finishes early, it can produce extra units for marginal profit.
 *
 * Overdue Penalty = overdueHours × penaltyRate × revenue
 *   → Realistic late-delivery penalty (default 0.5% of revenue per hour late).
 */
function computeSnapshot(
  blocks: ProcessBlock[],
  peopleAlloc: number[],
  config: OptimizerConfig
): {
  totalTime: number;
  totalCost: number;
  laborCost: number;
  materialCost: number;
  electricityCost: number;
  netProfit: number;
  revenue: number;
  opportunityGain: number;
  overduePenalty: number;
  timeSaved: number;
} {
  const electricityCostPerUnit = config.electricityCostPerUnit ?? DEFAULT_ELEC_COST_PER_UNIT;
  const totalTime = computeTotalTime(blocks, peopleAlloc, config.targetUnits);
  const revenue = config.targetUnits * config.sellingPricePerUnit;

  let totalLaborCost = 0;
  let totalMaterialCost = 0;
  let totalElecCost = 0;

  for (let i = 0; i < blocks.length; i++) {
    const costs = computeBlockCost(blocks[i], peopleAlloc[i], totalTime, config.targetUnits, electricityCostPerUnit);
    totalLaborCost += costs.laborCost;
    totalMaterialCost += costs.materialCost;
    totalElecCost += costs.electricityCost;
  }

  const totalCost = totalLaborCost + totalMaterialCost + totalElecCost;

  // ── Opportunity Gain ──
  // If finished before deadline, extra time can produce more units.
  // Gain = timeSaved × throughputRate × marginalProfitPerUnit
  // marginalProfitPerUnit = sellingPrice - sum(all blocks' material cost per unit)
  //
  // CAP: Throughput rate is based on current totalTime (not zero).
  // Also cap total gain at (timeSaved / timeLimitMinutes) × revenue to keep it realistic.
  const timeSaved = Math.max(0, config.timeLimitMinutes - totalTime);
  const throughputRate = totalTime > 0 ? config.targetUnits / totalTime : 0;
  const totalMaterialCostPerUnit = blocks.reduce((sum, b) => sum + b.cost_per_unit, 0);
  const marginalProfitPerUnit = config.sellingPricePerUnit - totalMaterialCostPerUnit;
  const rawOpportunityGain = config.sellingPricePerUnit > 0 && marginalProfitPerUnit > 0
    ? timeSaved * throughputRate * marginalProfitPerUnit
    : 0;
  // Cap: opportunity gain cannot exceed the proportional fraction of revenue
  // (if you saved 50% of the time, you can earn at most ~50% extra revenue)
  const maxOpportunityGain = config.timeLimitMinutes > 0
    ? (timeSaved / config.timeLimitMinutes) * revenue
    : 0;
  const opportunityGain = Math.min(rawOpportunityGain, maxOpportunityGain);

  // ── Overdue Penalty ──
  // If over deadline, penalty = overdueHours × penaltyRate × revenue
  const overdueMinutes = Math.max(0, totalTime - config.timeLimitMinutes);
  const overdueHours = overdueMinutes / 60;
  const penaltyRate = config.overduePenaltyRate ?? DEFAULT_OVERDUE_PENALTY_RATE;
  const overduePenalty = overdueHours * penaltyRate * revenue;

  return {
    totalTime,
    totalCost,
    laborCost: totalLaborCost,
    materialCost: totalMaterialCost,
    electricityCost: totalElecCost,
    netProfit: revenue + opportunityGain - totalCost - overduePenalty,
    revenue,
    opportunityGain,
    overduePenalty,
    timeSaved,
  };
}

// ─────────────────────────────────────────────
// Strategy Implementations
// ─────────────────────────────────────────────

/**
 * MODE: time — Minimize total production time (greedy bottleneck elimination)
 * Starts from current worker counts, adds to slowest machine until target time met.
 */
function optimizeForTime(
  blocks: ProcessBlock[],
  config: OptimizerConfig,
  budget: number
): { people: number[]; earlyStop: boolean; stopReason: string } {
  const people = blocks.map((b) => Math.max(1, b.people));
  let earlyStop = false;
  let stopReason = "Time target met";
  const MAX_ITER = 3000;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const effDurs = blocks.map((b, i) => effectiveDuration(b, people[i]));
    const bottleneck = Math.max(...effDurs);
    const totalTime = computeTotalTime(blocks, people, config.targetUnits);

    if (totalTime <= config.timeLimitMinutes) break;

    // Find bottleneck index (slowest machine)
    const bottleneckIdx = effDurs.indexOf(bottleneck);

    // Budget check
    const extraCost = blocks[bottleneckIdx].cost_per_person / WORKDAY_MINUTES;
    if (budget > 0) {
      const snap = computeSnapshot(blocks, people, config);
      if (snap.totalCost + extraCost > budget) {
        earlyStop = true;
        stopReason = "Budget limit reached";
        break;
      }
    }

    people[bottleneckIdx] += 1;

    if (iter === MAX_ITER - 1) {
      earlyStop = true;
      stopReason = "Max iterations reached — time target unachievable";
    }
  }

  return { people, earlyStop, stopReason };
}

/**
 * MODE: cost — Minimize total cost while meeting time target (Bidirectional)
 * Starts from current staff levels.
 * Phase 1: Reduce excess workers where savings exist and deadline is still met.
 * Phase 2: If over deadline, add cheapest workers to bottleneck.
 */
function optimizeForCost(
  blocks: ProcessBlock[],
  config: OptimizerConfig,
  budget: number
): { people: number[]; earlyStop: boolean; stopReason: string } {
  const people = blocks.map((b) => Math.max(1, b.people));
  let earlyStop = false;
  let stopReason = "Optimal cost found within time target";
  const MAX_ITER = 3000;

  // ── Phase 1: Reduce excess workers ──
  // Try removing the most expensive workers while still meeting deadline.
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const totalTime = computeTotalTime(blocks, people, config.targetUnits);
    if (totalTime > config.timeLimitMinutes) break; // already over → skip to Phase 2

    let bestSaving = 0;
    let bestIdx = -1;

    for (let i = 0; i < blocks.length; i++) {
      if (people[i] <= 1) continue; // floor at 1 person

      const trialPeople = [...people];
      trialPeople[i] -= 1;
      const trialTime = computeTotalTime(blocks, trialPeople, config.targetUnits);

      // Only consider if still within time limit
      if (trialTime > config.timeLimitMinutes) continue;

      const currentSnap = computeSnapshot(blocks, people, config);
      const trialSnap = computeSnapshot(blocks, trialPeople, config);
      const saving = currentSnap.totalCost - trialSnap.totalCost;

      if (saving > bestSaving) {
        bestSaving = saving;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break; // no more reductions possible
    people[bestIdx] -= 1;
  }

  // ── Phase 2: Add workers to bottleneck if still over deadline ──
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const effDurs = blocks.map((b, i) => effectiveDuration(b, people[i]));
    const bottleneck = Math.max(...effDurs);
    const totalTime = computeTotalTime(blocks, people, config.targetUnits);

    if (totalTime <= config.timeLimitMinutes) break;

    // Find all tied bottleneck machines
    const bottlenecks = effDurs
      .map((d, i) => ({ i, d, cost: blocks[i].cost_per_person }))
      .filter(({ d }) => d >= bottleneck - 0.001);

    // Among bottlenecks, choose cheapest worker to hire
    const cheapest = bottlenecks.sort((a, b) => a.cost - b.cost)[0];

    // Budget check
    if (budget > 0) {
      const snap = computeSnapshot(blocks, people, config);
      if (snap.totalCost + cheapest.cost / WORKDAY_MINUTES > budget) {
        earlyStop = true;
        stopReason = "Budget limit reached before time target";
        break;
      }
    }

    people[cheapest.i] += 1;

    if (iter === MAX_ITER - 1) {
      earlyStop = true;
      stopReason = "Max iterations reached";
    }
  }

  // Check final state
  const finalTime = computeTotalTime(blocks, people, config.targetUnits);
  if (finalTime <= config.timeLimitMinutes && !earlyStop) {
    stopReason = "Optimal cost found within time target";
  } else if (!earlyStop) {
    stopReason = "Time target could not be met — showing best effort";
  }

  return { people, earlyStop, stopReason };
}

/**
 * MODE: profit — Maximize net profit via Pareto Frontier Search (Global Optimization)
 *
 * Instead of Greedy Marginal Analysis which gets stuck in Local Maxima,
 * this algorithm maps out the entire "Cost vs Time" frontier:
 * 1. Starts from absolute minimum (1 worker per block).
 * 2. Continuously adds 1 worker to the cheapest tied bottleneck to optimally reduce time.
 * 3. Records net profit at every step until all tied bottlenecks hit MAX_PEOPLE_PER_BLOCK.
 * 4. Also evaluates the Current Staff baseline.
 * 5. Returns the allocation that generated the Global Maximum net profit.
 */
function optimizeForProfit(
  blocks: ProcessBlock[],
  config: OptimizerConfig,
  budget: number
): { people: number[]; earlyStop: boolean; stopReason: string } {
  // 1. Setup the frontier path starting from minimum
  const people = blocks.map(() => 1);
  let bestProfit = -Infinity;
  let bestPeople = [...people];

  // 2. Walk the Pareto curve
  const MAX_ITER = 3000;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    const snap = computeSnapshot(blocks, people, config);

    // Record if this is the highest profit seen so far
    if (snap.netProfit > bestProfit) {
      if (!(budget > 0 && snap.totalCost > budget)) {
        bestProfit = snap.netProfit;
        bestPeople = [...people];
      }
    }

    // Find bottleneck(s)
    const effDurs = blocks.map((b, i) => effectiveDuration(b, people[i]));
    const bottleneck = Math.max(...effDurs);
    const bottlenecks = effDurs
      .map((d, i) => ({ i, d, cost: blocks[i].cost_per_person }))
      .filter(({ d }) => d >= bottleneck - 0.001);

    // Only consider bottlenecks that haven't hit the cap
    const validBottlenecks = bottlenecks.filter(b => people[b.i] < MAX_PEOPLE_PER_BLOCK);
    if (validBottlenecks.length === 0) {
      break; // Reached MAX_PEOPLE_PER_BLOCK across all tied bottlenecks
    }

    // Step forward along the Pareto frontier by adding cheapest worker to break bottleneck
    const cheapest = validBottlenecks.sort((a, b) => a.cost - b.cost)[0];
    people[cheapest.i] += 1;
  }

  // 3. Also evaluate the Current Staff baseline to ensure we don't return something worse
  const currentPeople = blocks.map((b) => Math.max(1, b.people));
  const currentSnap = computeSnapshot(blocks, currentPeople, config);
  let stopReason = "Global profit peak found via Pareto frontier search";

  if (currentSnap.netProfit > bestProfit) {
    if (!(budget > 0 && currentSnap.totalCost > budget)) {
      bestPeople = currentPeople;
      stopReason = "Current staff already yields the global maximum profit";
    }
  }

  return { people: bestPeople, earlyStop: false, stopReason };
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────

/**
 * Run the optimizer and return full allocation + economics.
 */
export function runProfitOptimizer(
  blocks: ProcessBlock[],
  config: OptimizerConfig
): OptimizerResult {
  if (blocks.length === 0) {
    return {
      allocations: [],
      totalTime: 0, laborCost: 0, materialCost: 0,
      electricityCost: 0, totalCost: 0, revenue: 0,
      netProfit: 0, opportunityGain: 0, overduePenalty: 0,
      timeSaved: 0, budgetUsed: 0,
      withinBudget: true, withinTimeLimit: true,
      earlyStop: false, stopReason: "No blocks",
    };
  }

  const budget = config.budget ?? 0;
  const electricityCostPerUnit = config.electricityCostPerUnit ?? DEFAULT_ELEC_COST_PER_UNIT;

  // Run selected strategy
  let people: number[];
  let earlyStop: boolean;
  let stopReason: string;

  if (config.mode === "time") {
    ({ people, earlyStop, stopReason } = optimizeForTime(blocks, config, budget));
  } else if (config.mode === "cost") {
    ({ people, earlyStop, stopReason } = optimizeForCost(blocks, config, budget));
  } else {
    ({ people, earlyStop, stopReason } = optimizeForProfit(blocks, config, budget));
  }

  // Build final snapshot
  const snap = computeSnapshot(blocks, people, config);

  // Build per-block allocation details
  const allocations: BlockAllocation[] = blocks.map((b, i) => {
    const costs = computeBlockCost(b, people[i], snap.totalTime, config.targetUnits, electricityCostPerUnit);
    return {
      block_id: b.block_id,
      name: b.name,
      step_order: b.step_order,
      originalPeople: b.people,
      suggestedPeople: people[i],
      effectiveDuration: effectiveDuration(b, people[i]),
      laborCost: costs.laborCost,
      materialCost: costs.materialCost,
      electricityCost: costs.electricityCost,
      totalBlockCost: costs.total,
    };
  });

  return {
    allocations,
    totalTime: snap.totalTime,
    laborCost: snap.laborCost,
    materialCost: snap.materialCost,
    electricityCost: snap.electricityCost,
    totalCost: snap.totalCost,
    revenue: snap.revenue,
    netProfit: snap.netProfit,
    opportunityGain: snap.opportunityGain,
    overduePenalty: snap.overduePenalty,
    timeSaved: snap.timeSaved,
    budgetUsed: snap.totalCost,
    withinBudget: budget <= 0 || snap.totalCost <= budget,
    withinTimeLimit: snap.totalTime <= config.timeLimitMinutes,
    earlyStop,
    stopReason,
  };
}

/**
 * Compare all 3 strategies simultaneously.
 * Useful for the "profit" comparison UI.
 */
export function compareAllStrategies(
  blocks: ProcessBlock[],
  config: Omit<OptimizerConfig, "mode">
): { time: OptimizerResult; cost: OptimizerResult; profit: OptimizerResult } {
  return {
    time: runProfitOptimizer(blocks, { ...config, mode: "time" }),
    cost: runProfitOptimizer(blocks, { ...config, mode: "cost" }),
    profit: runProfitOptimizer(blocks, { ...config, mode: "profit" }),
  };
}
