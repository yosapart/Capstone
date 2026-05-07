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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const isoString = dateString.replace(' ', 'T').includes('Z') 
    ? dateString 
    : `${dateString.replace(' ', 'T')}Z`;
    const date = new Date(isoString); 
    return date.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Bangkok'
    });
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-col justify-between hover:shadow-lg hover:border-[#1594dd]/30 hover:scale-105 transition-all duration-300">
      <div className="flex">
        {/* ชื่อ Project — คลิกเข้า Flow Editor */}
        <Link
          href={`/project/${project.project_id}`}
          onClick={() => onView?.(project)}
          className="font-semibold text-[#34495e] text-[18px] truncate mr-4 hover:text-[#1594dd] transition-colors"
        >
          {project.name}
        </Link>
        <div className="flex-1" />
        {/* ปุ่ม */}
        <div className="flex items-center gap-2 shrink-0 shrink-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 ">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(project); }}
            className="text-[14px] font-semibold text-[#1594dd] bg-[#1594dd]/10 px-4 py-1.5 rounded-md cursor-pointer hover:bg-[#1594dd]/20 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(project); }}
            className="text-[14px] font-semibold text-red-500 bg-red-50 px-4 py-1.5 rounded-md cursor-pointer hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      
      <div className="text-[14px] text-gray-500 my-2">
        <p>Created: {formatDate(project.created_at)}</p>
        <p className="mt-0.5">Last viewed: {formatDateTime(project.updated_at)}</p>
      </div>
    </div>
  );
}
