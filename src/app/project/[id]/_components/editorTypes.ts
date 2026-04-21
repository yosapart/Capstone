export interface FlowData {
  flow_id: number;
  project_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface BlockData {
  block_id: number;
  flow_id: number;
  step_order: number;
  type: string;
  name: string;
  description: string;
  cost_per_unit: number;
  electricity_per_unit: number;
  people: number;
  cost_per_person: number;
  duration: number;
  // position_x?: number; // TODO: เตรียมไว้สำหรับเก็บพิกัดใน React Flow อนาคต
  // position_y?: number;
}

export interface ProjectData {
  project_id: number;
  name: string;
}

export interface TestcaseData {
  tc_id: number;
  name: string;
  type: string;      // "labor" | "electricity" | "material" | "machine"
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
  maxQueue?: number;
  idleTime?: number;
  isBottleneck?: boolean;
}

export interface SimulationResult {
  total_cost: number;
  total_electricity: number;
  total_duration: number;
  target_output: number;
  testcase: string;
  testcase_detail?: string;
  testcase_type?: string;
  steps: SimulationStep[];
  mode?: "instant" | "realtime";
  bottleneck_step_order?: number;
  selling_price_per_unit?: number;
  total_revenue?: number;
  net_profit?: number;
}

export const BLOCK_TYPES = [
  { type: "start", label: "Start", color: "#27ae60", border: "#1e8449" },
  { type: "process", label: "Process", color: "#e74c3c", border: "#c0392b" },
  { type: "end", label: "End", color: "#2c3e50", border: "#1a252f" },
];

export interface MachineVisualState {
  step_order: number;
  queue: number;
  timeRemaining: number;
  status: "idle" | "working" | "blocked";
  progress: number;
  cycle?: number;
}

export interface PlaybackState {
  currentProduce: number;
  cost: number;
  electricity: number;
  duration: number;
  machineStates?: Record<number, MachineVisualState>;
  sourceProgress?: number; // 0→1 สำหรับจุดเหลืองเส้น Start→M1
  revenue?: number;
  netProfit?: number;
}
