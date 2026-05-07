"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Header } from "@/app/_global_components/Header";
import { Sidebar } from "@/app/_global_components/Sidebar";
import { type Project } from "@/app/_global_components/ProjectCard";
import { CreateProjectModal } from "@/app/_global_components/CreateProjectModal";
import { DeleteProjectModal } from "@/app/_global_components/DeleteProjectModal";
import { IconSearch, IconPlus } from "@/app/_components/Icons";

import { RecentProjects } from "@/app/_global_components/RecentProject";
import { YourProjects } from "@/app/project/_components/YourProject";
import { filterUserProjects, getSortedProjects, getRecentProjects } from "@/app/project/utils";

interface UserInfo {
  user_id: number;
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [activeMenu, setActiveMenu] = useState("home");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ดึง projects จาก API
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/projects");
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
    setUser(JSON.parse(stored));
    fetchProjects();
  }, [router, fetchProjects]);

  if (!isMounted || !user) return null;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout failed", e);
    }
    sessionStorage.removeItem("user");
    window.dispatchEvent(new Event("user-changed"));
    router.push("/");
  };

  if (!user) return null;

  /* ─── กรองและเรียง projects ─── */
  const userProjects = filterUserProjects(projects, user, search);
  const sortedProjects = getSortedProjects(userProjects);
  const recentProjects = getRecentProjects(userProjects);

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">
      <Header user={user} />

      {/* ═══════ BODY (Sidebar + Content) ═══════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── SIDEBAR ─── */}
        <Sidebar
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          onLogout={handleLogout}
        />

        {/* ─── CONTENT ─── */}
        <main className="flex-1 overflow-y-auto p-8">

          {/* Top actions row */}
          <div className="flex items-center justify-between mb-10 gap-4">
            {/* Search */}
            <div className="flex items-center w-full max-w-[500px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#1594dd]/20 focus-within:border-[#1594dd] transition-all">
              <div className="text-gray-400">
                <IconSearch />
              </div>
              <input
                type="text"
                placeholder="Search your project"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-gray-800 placeholder-gray-400 outline-none w-full text-sm"
              />
            </div>
            <div className="flex items-center gap-3">

              {/* Create Project */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-[#1594dd] text-white font-semibold text-sm px-5 py-2.5 cursor-pointer rounded-lg hover:bg-[#1277b5] transition-all shadow-sm hover:shadow-md"
              >
                <IconPlus />
                Create Project
              </button>
            </div>
          </div>

          {/* Recent Projects */}
          <RecentProjects 
            loading={loadingProjects}
            projects={recentProjects}
            onEdit={setProjectToEdit}
            onDelete={setProjectToDelete}
            onView={(id) => router.push(`/project/${id}`)}
          />

          {/* Your Projects */}
          <YourProjects 
            loading={loadingProjects}
            projects={sortedProjects}
            onEdit={setProjectToEdit}
            onDelete={setProjectToDelete}
            onView={(id) => router.push(`/project/${id}`)}
          />
        </main>
      </div>

      {/* ═══════ CREATE/EDIT PROJECT MODAL ═══════ */}
      {(showCreateModal || projectToEdit) && (
        <CreateProjectModal
          existingProject={projectToEdit}
          onClose={() => {
            setShowCreateModal(false);
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

      {/* ═══════ DELETE CONFIRMATION MODAL ═══════ */}
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