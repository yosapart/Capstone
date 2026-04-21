// ========== Simulation Calculation Engine ==========
// แยก logic คำนวณออกมาจาก route เพื่อให้ test ง่ายและ reuse ได้

export interface BlockData {
  block_id?: number;
  step_order: number;
  type: string;
  name: string;
  cost_per_unit: number;
  electricity_per_unit: number;
  people: number;
  cost_per_person: number;
  duration: number;
}

export interface TestcaseData {
  tc_id: number;
  name: string;
  type: string;  // "labor" | "electricity" | "material" | "machine"
  value: number;
  probability: number;
  description?: string;
}

export interface SimulationStep {
  step_order: number;
  name: string;
  type?: string;
  cost?: number;
  electricity?: number;
  duration?: number;
  skipped?: boolean;
  isBottleneck?: boolean;
  maxQueue?: number;
  avgQueue?: number;
  idleTime?: number;
}

export interface SimulationOutput {
  total_cost: number;
  total_electricity: number;
  total_duration: number;
  target_output: number;
  testcase: string;
  steps: SimulationStep[];
  bottleneck_step_order?: number;
  testcase_detail?: string;
  testcase_type?: string;
}

export function calculateSimulation(
  blocks: BlockData[],
  target_output: number,
  appliedTestcase: TestcaseData | null
): SimulationOutput {
  const steps: SimulationStep[] = [];
  const QUEUE_LIMIT = 10;
  const WORKING_MINUTES_PER_DAY = 480;

  // Pre-process Start/End blocks to normal Steps output immediately
  const startBlock = blocks.find(b => b.type === "start");
  if (startBlock) steps.push({ step_order: startBlock.step_order, name: startBlock.name, type: "start" });
  
  const endBlock = blocks.find(b => b.type === "end");

  // Keep only process blocks for DES
  const processBlocks = blocks.filter(b => b.type === "process");
  const blockToBreak = processBlocks.length > 0 ? processBlocks[Math.floor(Math.random() * processBlocks.length)] : null;

  interface Machine {
    block: BlockData;
    queue: number;
    inProgress: boolean;
    timeRemaining: number;
    blockedItem: boolean;
    totalAccumulatedQueue: number;
    maxQueueSeen: number;
    totalWorkingTime: number;
    totalIdleTime: number;
    duration: number;
    cost_per_unit: number;
    electricity_per_unit: number;
    people: number;
    cost_per_person: number;
    skip: boolean;
  }

  const machines: Machine[] = processBlocks.map(b => {
    let cost_per_unit = Number(b.cost_per_unit) || 0;
    let electricity_per_unit = Number(b.electricity_per_unit) || 0;
    let people = Number(b.people) || 0;
    let cost_per_person = Number(b.cost_per_person) || 0;
    let duration = Number(b.duration) || 0;
    let skip = false;

    if (cost_per_unit < 0 || electricity_per_unit < 0 || people < 0 || cost_per_person < 0 || duration < 0) {
      throw new Error("NEGATIVE_VALUES");
    }

    if (appliedTestcase) {
      const tc = appliedTestcase;
      if (tc.type === "labor") {
        const remainingWorkforceRatio = 1 - Number(tc.value);
        people = people * remainingWorkforceRatio;
        // ยิ่งคนงานน้อยลง เวลาในการผลิต (duration) ก็ยิ่งนานขึ้น (แปรผกผันกัน)
        if (remainingWorkforceRatio > 0) {
          duration = duration / remainingWorkforceRatio;
        }
      }
      if (tc.type === "electricity") electricity_per_unit = electricity_per_unit * (1 + Number(tc.value));
      if (tc.type === "material") cost_per_unit = cost_per_unit * (1 + Number(tc.value));
      if (tc.type === "machine") {
        if (blockToBreak && b.block_id === blockToBreak.block_id) {
          skip = true;
          duration += 10;
        }
      }
    }

    if (duration <= 0) duration = 0.001; // prevent infinite loops in DES

    return {
      block: b,
      queue: 0,
      inProgress: false,
      timeRemaining: 0,
      blockedItem: false,
      totalAccumulatedQueue: 0,
      maxQueueSeen: 0,
      totalWorkingTime: 0,
      totalIdleTime: 0,
      duration,
      cost_per_unit,
      electricity_per_unit,
      people,
      cost_per_person,
      skip
    };
  });

  let sourceItems = target_output;
  let completedItems = 0;
  let clock = 0;

  // Discrete Event Loop
  if (machines.length > 0 && target_output > 0) {
    while (completedItems < target_output) {
      // Find min time delta
      let minStep = Infinity;
      for (const m of machines) {
        if (m.inProgress && m.timeRemaining > 0 && m.timeRemaining < minStep) {
          minStep = m.timeRemaining;
        }
      }
      if (minStep === Infinity) minStep = 1;

      clock += minStep;

      // Progress Time
      for (const m of machines) {
        m.totalAccumulatedQueue += m.queue * minStep;

        if (m.inProgress && m.timeRemaining > 0) {
          m.timeRemaining -= minStep;
          m.totalWorkingTime += minStep;
          if (m.timeRemaining <= 0) {
            m.inProgress = false;
            m.blockedItem = true;
          }
        } else if (!m.inProgress && !m.blockedItem) {
          m.totalIdleTime += minStep;
        }
      }

      // Move Items (from back to front)
      for (let i = machines.length - 1; i >= 0; i--) {
        const m = machines[i];
        if (m.blockedItem) {
          if (i === machines.length - 1) {
            m.blockedItem = false;
            completedItems++;
          } else {
            const nextM = machines[i + 1];
            if (nextM.queue < QUEUE_LIMIT) {
              m.blockedItem = false;
              nextM.queue++;
              if (nextM.queue > nextM.maxQueueSeen) nextM.maxQueueSeen = nextM.queue;
            }
          }
        }
      }

      // Source generates into first machine
      while (sourceItems > 0 && machines[0].queue < QUEUE_LIMIT) {
        sourceItems--;
        machines[0].queue++;
        if (machines[0].queue > machines[0].maxQueueSeen) machines[0].maxQueueSeen = machines[0].queue;
      }

      // Start processing what is in queue
      for (let i = 0; i < machines.length; i++) {
        const m = machines[i];
        if (!m.inProgress && !m.blockedItem && m.queue > 0) {
          m.queue--;
          m.inProgress = true;
          m.timeRemaining = m.duration;
        }
      }
    }
  }

  // Calculate Costs & Determine Bottleneck
  let total_cost = 0;
  let total_electricity = 0;
  
  let bottleneckMachine = null;
  let maxWaitVolume = -1;

  for (const m of machines) {
    if (m.totalAccumulatedQueue > maxWaitVolume) {
      maxWaitVolume = m.totalAccumulatedQueue;
      bottleneckMachine = m;
    }
  }

  for (const m of machines) {
    if (m.skip) {
      steps.push({ step_order: m.block.step_order, name: m.block.name, skipped: true, duration: m.duration });
      continue;
    }

    const wage_per_minute = m.cost_per_person / WORKING_MINUTES_PER_DAY;
    
    // clock is in minutes. 
    const labor_cost = m.people * wage_per_minute * clock;
    const material_cost = m.cost_per_unit * target_output;

    const block_cost = material_cost + labor_cost;
    const block_electricity = m.electricity_per_unit * target_output;

    total_cost += block_cost;
    total_electricity += block_electricity;

    const isBottleneck = (m === bottleneckMachine) && (m.totalAccumulatedQueue > 0);

    steps.push({
      step_order: m.block.step_order,
      name: m.block.name,
      cost: block_cost,
      electricity: block_electricity,
      duration: m.duration,
      isBottleneck,
      maxQueue: m.maxQueueSeen,
      avgQueue: clock > 0 ? (m.totalAccumulatedQueue / clock) : 0,
      idleTime: m.totalIdleTime
    });
  }

  if (endBlock) {
    steps.push({ step_order: endBlock.step_order, name: endBlock.name, type: "end" });
  }

  return {
    total_cost,
    total_electricity,
    total_duration: clock > 0 ? clock : 0,
    target_output,
    testcase: appliedTestcase?.name || "none",
    testcase_detail: appliedTestcase?.description || "",
    testcase_type: appliedTestcase?.type || "none",
    steps,
    bottleneck_step_order: (bottleneckMachine && maxWaitVolume > 0) ? bottleneckMachine.block.step_order : undefined
  };
}
