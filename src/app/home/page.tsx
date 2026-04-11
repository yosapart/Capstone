"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { IconSearch, IconPlus } from "../_components/Icons";
import { Sidebar } from "../_components/Sidebar";
import { ProjectCard, type Project } from "../_components/ProjectCard";
import { CreateProjectModal } from "../_components/CreateProjectModal";

/* ───── types ───── */
interface UserInfo {
  user_id: number;
  name: string;
  email: string;
}

/* ───── main page ───── */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu] = useState("projects");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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
    const stored = localStorage.getItem("user");
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
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("user-changed"));
    router.push("/");
  };

  if (!user) return null;

  /* ─── กรองและเรียง projects ─── */
  const userProjects = projects.filter((p) => p.user_id === user.user_id);

  const sortedProjects = [...userProjects].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return a.name.localeCompare(b.name);
  });

  const recentProjects = [...userProjects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">

      {/* ═══════ HEADER ═══════ */}
      <header className="flex items-center h-[60px] bg-[#34495e] px-6 shrink-0 z-50 shadow-md">
        {/* Logo */}
        <Link href="/" className="shrink-0 mr-6">
          <Image src="/FacSimLogo.png" alt="FacSim Logo" width={140} height={16} priority />
        </Link>

        {/* Search */}
        <div className="flex items-center flex-1 max-w-[520px] mx-auto bg-[#2c3e50] rounded-full px-4 py-2 gap-2">
          <IconSearch />
          <input
            type="text"
            placeholder="Search your project"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder-gray-400 outline-none w-full text-sm"
          />
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-3 ml-auto shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-sm uppercase">
            {user.name?.charAt(0) || "U"}
          </div>
        </div>
      </header>

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
          <div className="flex items-center justify-between mb-8">
            <div /> {/* spacer */}
            <div className="flex items-center gap-3">
              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-300 text-sm text-gray-600 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#1594dd] cursor-pointer"
              >
                <option value="newest">Sort By: Newest</option>
                <option value="oldest">Sort By: Oldest</option>
                <option value="name">Sort By: Name</option>
              </select>

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
                  <ProjectCard key={p.project_id} project={p} />
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
                  <ProjectCard key={p.project_id} project={p} />
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

      {/* ═══════ CREATE PROJECT MODAL ═══════ */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
