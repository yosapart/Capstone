import Link from "next/link";

export interface Project {
  project_id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onView?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between hover:shadow-md hover:border-[#1594dd]/30 transition-all">
      {/* ชื่อ Project — คลิกเข้า Flow Editor */}
      <Link
        href={`/project/${project.project_id}`}
        onClick={() => onView?.(project)}
        className="font-semibold text-[#34495e] text-sm truncate mr-4 hover:text-[#1594dd] transition-colors"
      >
        {project.name}
      </Link>

      {/* ปุ่ม */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}
          className="text-xs font-semibold text-[#1594dd] bg-[#1594dd]/10 px-4 py-1.5 rounded-md hover:bg-[#1594dd]/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
          className="text-xs font-semibold text-red-500 bg-red-50 px-4 py-1.5 rounded-md hover:bg-red-100 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
