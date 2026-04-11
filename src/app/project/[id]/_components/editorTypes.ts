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

export const BLOCK_TYPES = [
  { type: "start",      label: "Start",      color: "#27ae60", border: "#1e8449" },
  { type: "process",    label: "Process",    color: "#e74c3c", border: "#c0392b" },
  { type: "end",        label: "End",        color: "#2c3e50", border: "#1a252f" },
];
