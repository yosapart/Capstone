export interface Project {
  project_id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  flows_stats?: { name: string; block_count: number }[];
  block_count?: number;
}