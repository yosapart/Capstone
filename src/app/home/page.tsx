"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Header } from "../_global_components/Header";
import { Sidebar } from "../_global_components/Sidebar";
import  Welcome  from "@/app/home/_components/welcome";
import { RecentProjects } from "@/app/_global_components/RecentProject";
import { type Project } from "../_global_components/ProjectCard";
import { CreateProjectModal } from "../_global_components/CreateProjectModal";
import { DeleteProjectModal } from "../_global_components/DeleteProjectModal";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [activeMenu, setActiveMenu] = useState("home");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // ดึง projects จาก API
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch(`/api/projects`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const stored = sessionStorage.getItem("user");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch {
      router.push("/");
    }

    fetchProjects();
  }, [router, fetchProjects]);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("user-changed"));
    router.push("/");
  };

  if (!user) return null;

  /* ─── กรองและเรียง projects ─── */
  const userProjects = projects.filter((p) => p.user_id === user.user_id);

  const recentByUpdate = [...userProjects]
  .sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return dateB - dateA;
  })
  .slice(0, 3);

  if (!isMounted || !user) return <div className="h-screen bg-[#f0f2f5]" />;

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">
      <Header user={user} />

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-10">
          <Welcome user={user} loadingProjects={loadingProjects} userProjects={userProjects} />

          <RecentProjects 
            loading={loadingProjects}
            projects={recentByUpdate}
            onEdit={setProjectToEdit}
            onDelete={setProjectToDelete}
            onView={(id) => router.push(`/project/${id}`)}
          />
          
        </main>
      </div>

      {(projectToEdit) && (
        <CreateProjectModal
          existingProject={projectToEdit}
          onClose={() => {
            setProjectToEdit(null);
          }}
          onCreated={(projectId: number | string) => {
            router.push(`/project/${projectId}`);
          }}
          onUpdated={() => {
            fetchProjects();
          }}
        />
      )}
  
      {projectToDelete && (
        <DeleteProjectModal
          project={projectToDelete}
          onClose={() => setProjectToDelete(null)}
          onDeleted={() => fetchProjects()}
        />
      )}
    </div>
  );
}