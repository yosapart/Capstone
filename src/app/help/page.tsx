"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

import { Header } from "../_global_components/Header";
import { Sidebar } from "../_global_components/Sidebar";

/* ───── types ───── */
interface UserInfo {
    user_id: number;
    name: string;
    email: string;
}

export default function ProjectPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("user");
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    });
    const [activeMenu, setActiveMenu] = useState("projects");

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
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("user");
        window.dispatchEvent(new Event("user-changed"));
        router.push("/");
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen bg-[#f0f2f5] overflow-hidden">
            <Header user={user} />

            <div className="flex flex-1 overflow-hidden">

            <Sidebar
                activeMenu={activeMenu}
                onMenuChange={setActiveMenu}
                onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto p-8">
                help
            </main>
            </div>
        </div>
    );
}
