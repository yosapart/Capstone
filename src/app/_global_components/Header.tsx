"use client";

import Link from "next/link";
import Image from "next/image";

interface UserInfo {
    name: string;
    email: string;
}

interface HeaderProps {
    user: UserInfo | null;
}

export function Header({ user }: HeaderProps){
    return(
            <header className="flex items-center h-[60px] bg-[#34495e] px-6 shrink-0 z-50 shadow-md">
            <Link href="/home" className="shrink-0 mr-6">
              <Image src="/FacSimLogo.png" alt="FacSim Logo" width={140} height={16} priority />
            </Link>

            <div className="flex items-center gap-3 ml-auto shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-sm uppercase">
                {user?.name ? user.name.charAt(0) : "U"}
              </div>
            </div>
        </header>
    )
}