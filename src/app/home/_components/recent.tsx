"use client";

import { ProjectCard, type Project } from "@/app/_global_components/ProjectCard";

interface RecentProps {
    recentProjects: Project[];
    loadingProjects: boolean;
    onEdit: (project: Project) => void;
    onDelete: (project: Project) => void;
    onView: (project: Project) => void;
}

export default function Recent({ 
    recentProjects, 
    loadingProjects, 
    onEdit, 
    onDelete, 
    onView 
}: RecentProps) {
    return (
        <section className="mb-10 bg-[#ffffff] mt-10 p-4 pb-8 rounded-[10px] ">
            <h2 className="text-[22px] font-bold text-[#34495e] mb-6">Recent Project</h2>
            {loadingProjects ? (
                <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400 text-sm">loading...</p>
                </div>
            ) : recentProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recentProjects.map((p) => (
                        <ProjectCard 
                            key={p.project_id} 
                            project={p} 
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center py-8">
                    <p className="text-gray-400 text-sm italic">No recent projects</p>
                </div>
            )}
        </section>
    );
}