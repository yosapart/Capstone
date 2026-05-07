import { type Project } from "@/app/_global_components/ProjectCard";

interface UserInfo {
  user_id: number;
  name: string;
  email: string;
}

export const filterUserProjects = (
  projects: Project[],
  user: UserInfo,
  search: string
) => {
  return projects.filter((p) => {
    const isOwner = p.user_id === user.user_id;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return isOwner && matchesSearch;
  });
};

export const getSortedProjects = (userProjects: Project[]) => {
  return [...userProjects].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

export const getRecentProjects = (projects: Project[]) => {
  return [...projects]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || 0).getTime();
      const dateB = new Date(b.updated_at || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);
};
