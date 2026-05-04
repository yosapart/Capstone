import { ProjectCard, type Project } from "@/app/_global_components/ProjectCard";

interface RecentProjectsProps {
    loading: boolean;
    projects: Project[];
    onEdit: (p: Project) => void;
    onDelete: (p: Project) => void;
    onView: (id: number) => void;
}

export function RecentProjects({ loading, projects, onEdit, onDelete, onView }: RecentProjectsProps) {
    return (
        <section className="mb-10">
            <h2 className="text-[24px] font-bold text-[#34495e] mb-4">Recent Project</h2>
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400 text-sm">loading...</p>
                </div>
            ) : projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((p) => (
                        <ProjectCard 
                            key={p.project_id} 
                            project={p} 
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={(proj) => onView(proj.project_id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400 italic">No recent projects</p>
                </div>
            )}
        </section>
    );
}