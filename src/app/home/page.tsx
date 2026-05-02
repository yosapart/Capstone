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

      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          activeMenu={activeMenu}
          onMenuChange={setActiveMenu}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-10">
          <section className="flex justify-between">
            <h2 className="font-bold text-[26px] ">Welcome, {user.name}.</h2>
            <div className="bg-[#ffffff] p-5 pt-3 pl-4 rounded-[10px] w-60 text-[18px] font-medium ">
              Total Projects
              <p className="mt-3 text-[35px] ">
                {loadingProjects ? "..." : userProjects.length}
              </p>
            </div>
          </section>

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