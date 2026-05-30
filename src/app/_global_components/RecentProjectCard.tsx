import Link from "next/link";
import Image from "next/image";
import { type Project } from "./ProjectCard";
import { formatRelativeTime, formatShortDate } from "./timeUtils";
import workflowIcon from "@/icon/workflow.png";

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onView?: (project: Project) => void;
}

export function RecentProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  return (
    <div className="group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-xl hover:border-[#5d88bd]/40 hover:-translate-y-1 transition-all duration-300 h-48 relative">
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #5d88bd 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
      
      <div className="p-5 flex flex-col flex-1 relative z-10">
        <div className="flex justify-between items-start">
          <Link
            href={`/project/${project.project_id}`}
            onClick={() => onView?.(project)}
            className="font-bold text-gray-900 text-[20px] truncate pr-4 hover:text-[#5d88bd] transition-colors before:absolute before:inset-0"
          >
            {project.name}
          </Link>
          <div className="shrink-0 flex items-center gap-1.5 bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatRelativeTime(project.updated_at)}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
             <Image src={workflowIcon} alt="Flow" width={12} height={12} className="opacity-70 grayscale" />
             {project.flows_stats ? project.flows_stats.length : 0} {project.flows_stats && project.flows_stats.length <= 1 ? 'Flow' : 'Flows'}
          </span>
        </div>
        
        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-end">
          <div className="flex flex-col gap-1 text-[13px]">
            <p className="text-slate-400">Created: <span className="text-slate-600 font-bold">{formatShortDate(project.created_at)}</span></p>
          </div>
            
            <div className="relative z-10 flex items-center gap-2 shrink-0 invisible opacity-0 translate-x-2 group-hover:translate-x-0 group-hover:visible group-hover:opacity-100 transition-all duration-300">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}
                    className="text-[13px] font-bold text-[#5d88bd] bg-[#5d88bd]/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#5d88bd]/20 transition-colors"
                >
                    Edit
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
                    className="text-[13px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-rose-100 transition-colors"
                >
                    Delete
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}