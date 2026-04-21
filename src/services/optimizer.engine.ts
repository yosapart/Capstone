/**
 * Factory Profit Optimizer Engine
 * ================================
 * A realistic economic optimizer that maximizes net profit by considering:
 * - Dynamic labor cost (based on actual production time)
 * - Dynamic electricity cost (proportional to machine run time)
 * - Material cost (per unit produced)
 * - Budget constraints
 * - Diminishing returns on workers
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _electricityCostPerUnit: number
): { laborCost: number; materialCost: number; electricityCost: number; total: number } {
  const wage_per_minute = block.cost_per_person / WORKDAY_MINUTES;
  const laborCost = people * wage_per_minute * totalTime;
  const materialCost = block.cost_per_unit * targetUnits;

  // Electricity has TWO components:
  // 1. Fixed: electricity_per_unit × units (base consumption regardless of speed)
  // 2. Time-based: electricity_per_unit/duration × totalTime (machine running cost)
  //    → More workers = faster production = less time = lower electricity bill
  //    → This creates a real trade-off between labor and electricity cost
  const elecPerMinute = block.duration > 0 ? (block.electricity_per_unit / block.duration) : 0;
  const electricityCost = (block.electricity_per_unit * targetUnits) + (elecPerMinute * totalTime);

  return {
    laborCost,
    materialCost,
    electricityCost,
    total: laborCost + materialCost + electricityCost,
  };
}

/**
 * Compute total time from worker allocations (bottleneck = slowest machine)
 */
function computeTotalTime(blocks: ProcessBlock[], peopleAlloc: number[], targetUnits: number): number {
  const effDurs = blocks.map((b, i) => effectiveDuration(b, peopleAlloc[i]));
  const bottleneckDur = Math.max(...effDurs);
  return bottleneckDur * targetUnits;
}

/**
 * Compute full economic snapshot from current allocation
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

  return {
    totalTime,
    totalCost,
    laborCost: totalLaborCost,
    materialCost: totalMaterialCost,
    electricityCost: totalElecCost,
    netProfit: revenue - totalCost,
    revenue,
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
    const totalTime = bottleneck * config.targetUnits;

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
 * MODE: cost — Minimize total cost while meeting time target
 * Resets to 1 worker, then adds cheapest worker that eliminates bottleneck.
 */
function optimizeForCost(
  blocks: ProcessBlock[],
  config: OptimizerConfig,
  budget: number
): { people: number[]; earlyStop: boolean; stopReason: string } {
  const people = blocks.map(() => 1);
  let earlyStop = false;
  let stopReason = "Time target met with minimum cost";
  const MAX_ITER = 3000;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    const effDurs = blocks.map((b, i) => effectiveDuration(b, people[i]));
    const bottleneck = Math.max(...effDurs);
    const totalTime = bottleneck * config.targetUnits;

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

  return { people, earlyStop, stopReason };
}

/**
 * MODE: profit — Maximize net profit via marginal profit analysis
 * 
 * Key insight: Adding a worker to a block has TWO effects:
 *   1. Reduces total time → reduces electricity cost AND labor idle time
 *   2. Increases direct labor cost for that block
 * 
 * We evaluate: profitGain = newProfit - currentProfit
 * Only add if profitGain > 0 AND within budget.
 * Stop when no profitable action exists.
 */
function optimizeForProfit(
  blocks: ProcessBlock[],
  config: OptimizerConfig,
  budget: number
): { people: number[]; earlyStop: boolean; stopReason: string } {
  // Start from cost-optimal baseline (reset to 1)
  const people = blocks.map(() => 1);
  let earlyStop = false;
  let stopReason = "Maximum profit found";
  const MAX_ITER = 3000;

  let currentSnap = computeSnapshot(blocks, people, config);

  for (let iter = 0; iter < MAX_ITER; iter++) {
    // Evaluate adding 1 worker to each block and find best profit gain
    let bestGain = -Infinity;
    let bestIdx = -1;

    for (let i = 0; i < blocks.length; i++) {
      const trialPeople = [...people];
      trialPeople[i] += 1;
      const trialSnap = computeSnapshot(blocks, trialPeople, config);

      // Reject if over budget
      if (budget > 0 && trialSnap.totalCost > budget) continue;

      // Reject if time limit exceeded when selling price > 0 (respect time constraint)
      if (config.sellingPricePerUnit > 0 && trialSnap.totalTime > config.timeLimitMinutes * 2) continue;

      const profitGain = trialSnap.netProfit - currentSnap.netProfit;
      if (profitGain > bestGain) {
        bestGain = profitGain;
        bestIdx = i;
      }
    }

    // No profitable action exists → stop
    if (bestIdx === -1 || bestGain <= 0) {
      earlyStop = bestGain <= 0;
      stopReason = bestGain <= 0
        ? "Profit peak reached — adding workers reduces net profit"
        : "Budget limit — cannot improve further";
      break;
    }

    people[bestIdx] += 1;
    currentSnap = computeSnapshot(blocks, people, config);

    if (iter === MAX_ITER - 1) {
      earlyStop = true;
      stopReason = "Max iterations reached";
    }
  }

  return { people, earlyStop, stopReason };
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
      netProfit: 0, budgetUsed: 0,
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
