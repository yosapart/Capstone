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

export function CompactProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-[#5d88bd]/30 hover:bg-slate-50/50 transition-all duration-200 overflow-hidden h-27.5">
      
      <Link
        href={`/project/${project.project_id}`}
        onClick={() => onView?.(project)}
        className="flex flex-col justify-between p-4 h-full w-full cursor-pointer"
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 overflow-hidden pr-2">
            <div className="font-bold text-gray-900 text-[16px] truncate group-hover:text-[#5d88bd] transition-colors">
              {project.name}
            </div>
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
               <Image src={workflowIcon} alt="Flow" width={12} height={12} className="opacity-70 grayscale" />
               {project.flows_stats ? project.flows_stats.length : 0} {project.flows_stats && project.flows_stats.length <= 1 ? 'Flow' : 'Flows'}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {formatRelativeTime(project.updated_at)}
          </div>
        </div>

        <div className="flex justify-between items-end mt-auto pt-2">
          <div className="text-[12px] text-slate-400">
              Created: <span className="text-slate-600 font-semibold">{formatShortDate(project.created_at)}</span>
          </div>
        </div>
      </Link>

      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 invisible opacity-0 translate-x-2 group-hover:translate-x-0 group-hover:visible group-hover:opacity-100 transition-all duration-200">
          <button
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onEdit?.(project); 
              }}
              className="text-[12px] font-bold text-[#5d88bd] bg-[#5d88bd]/10 px-3 py-1.5 rounded-md cursor-pointer hover:bg-[#5d88bd]/20 transition-colors"
          >
              Edit
          </button>
          <button
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                onDelete?.(project); 
              }}
              className="text-[12px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-md cursor-pointer hover:bg-rose-100 transition-colors"
          >
              Delete
          </button>
      </div>
    </div>
  );
}