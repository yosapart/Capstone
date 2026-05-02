"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Header } from "../_global_components/Header";
import { Sidebar } from "../_global_components/Sidebar";
import { ProjectCard, type Project } from "../_global_components/ProjectCard";
import { CreateProjectModal } from "../_global_components/CreateProjectModal";
import { DeleteProjectModal } from "../_global_components/DeleteProjectModal";
import { IconSearch, IconPlus } from "../_components/Icons";

interface UserInfo {
  user_id: number;
  name: string;
  email: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [activeMenu, setActiveMenu] = useState("home");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ฟังก์ชันบันทึกโปรเจกต์ที่เพิ่งเข้าชม
  const trackRecent = useCallback((id: number) => {
    const stored = localStorage.getItem("recent_viewed_ids");
    let ids: number[] = stored ? JSON.parse(stored) : [];
    // เอา id ใหม่ไว้หน้าสุด, ลบตัวซ้ำ, เก็บแค่ 3 อัน
    ids = [id, ...ids.filter(x => x !== id)].slice(0, 3);
    localStorage.setItem("recent_viewed_ids", JSON.stringify(ids));
  }, []);

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
  const userProjects = projects.filter((p) => {
    const isOwner = p.user_id === user.user_id;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return isOwner && matchesSearch;
  });

  const sortedProjects = [...userProjects].sort((a, b) => 
    a.name.localeCompare(b.name, 'th', { sensitivity: 'accent' })
  );

  // คัดกรอง Recent Projects (เรียงตามการเข้าชมล่าสุดใน localStorage หรือ ID ล่าสุดถ้าไม่มีข้อมูล)
  const recentProjects = (() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem("recent_viewed_ids") : null;
    const recentIds: number[] = stored ? JSON.parse(stored) : [];
    
    // ดึงโปรเจกต์ตามลำดับใน localStorage
    const viewed = recentIds
      .map(id => userProjects.find(p => p.project_id === id))
      .filter((p): p is Project => !!p);

    // ถ้ามีไม่ถึง 3 อัน ให้เอาโปรเจกต์ที่สร้างล่าสุดมาเติม
    if (viewed.length < 3) {
      const others = [...userProjects]
        .sort((a, b) => b.project_id - a.project_id)
        .filter(p => !recentIds.includes(p.project_id));
      
      return [...viewed, ...others].slice(0, 3);
    }

    return viewed;
  })();

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
          <div className="flex items-center justify-between mb-8 gap-4">
            {/* Search */}
            <div className="flex items-center w-full max-w-[320px] bg-white border border-gray-200 rounded-xl px-4 py-2.5 gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#1594dd]/20 focus-within:border-[#1594dd] transition-all">
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
                className="flex items-center gap-2 bg-[#1594dd] text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#1277b5] transition-all shadow-sm hover:shadow-md"
              >
                <IconPlus />
                Create Project
              </button>
            </div>
          </div>

          {/* ── Recent Projects ── */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#34495e] mb-4">Recent Project</h2>
            {loadingProjects ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">กำลังโหลด...</p>
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recentProjects.map((p) => (
                  <ProjectCard 
                    key={p.project_id} 
                    project={p} 
                    onEdit={(proj) => setProjectToEdit(proj)}
                    onDelete={(proj) => setProjectToDelete(proj)}
                    onView={(proj) => trackRecent(proj.project_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm italic">No recent projects</p>
              </div>
            )}
          </section>

          {/* ── Your Projects ── */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#34495e] mb-4">Your Project</h2>
            {loadingProjects ? (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-400 text-sm">กำลังโหลด...</p>
              </div>
            ) : sortedProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedProjects.map((p) => (
                  <ProjectCard 
                    key={p.project_id} 
                    project={p} 
                    onEdit={(proj) => setProjectToEdit(proj)}
                    onDelete={(proj) => setProjectToDelete(proj)}
                    onView={(proj) => trackRecent(proj.project_id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-gray-400 text-base font-medium italic">
                  — You don&apos;t have any project —
                </p>
              </div>
            )}
          </section>
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