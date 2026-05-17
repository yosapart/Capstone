import { ProjectCard, type Project } from "@/app/_global_components/ProjectCard";

interface SearchResultsProps {
    loading: boolean;
    searchQuery: string;
    projects: Project[];
    onEdit: (p: Project) => void;
    onDelete: (p: Project) => void;
    onView: (id: number) => void;
    onClearSearch: () => void;
}

export function SearchResults({
    loading,
    searchQuery,
    projects,
    onEdit,
    onDelete,
    onView,
    onClearSearch,
}: SearchResultsProps) {
    return (
        <section className="mb-10 bg-[#ffffff] mt-10 p-6 pb-8 rounded-[10px]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-[24px] font-bold text-[#34495e]">
                    Search Results for "{searchQuery}"
                </h2>
                <span className="text-sm text-gray-500">
                    Found {projects.length} {projects.length <= 1 ? "project" : "projects"}
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <p className="text-gray-400 text-[17px]">Loading...</p>
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
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-gray-400 text-base text-[17px] font-normal italic mb-2">
                        No projects found matching.
                    </p>
                    <button
                        onClick={onClearSearch}
                        className="text-[14.5px] text-[#1594DD] hover:text-[#1277B5] hover:underline font-medium cursor-pointer transition-colors"
                    >
                        Clear search
                    </button>
                </div>
            )}
        </section>
    );
}