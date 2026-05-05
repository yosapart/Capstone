"use client";

import Link from "next/link";
import Image from "next/image";

interface UserInfo {
    name?: string;
    email?: string;
}

interface HeaderProps {
    user: UserInfo | null;
    projectName?: string;
}

export function Header({ user, projectName = "Project Name" }: HeaderProps){
    const rawEmail = user?.email || "";
    const [localPart, domainPart] = rawEmail.split('@');
  
    const displayEmail = (localPart?.length > 25) 
        ? `${localPart.substring(0, 15)}...@${domainPart}` 
        : rawEmail;

    const emailLen = displayEmail.length;
    const nameStr = user?.name || "";

    const displayName = (nameStr.length > emailLen) 
        ? nameStr.substring(0, Math.max(0, emailLen - 3)) + "..." 
        : nameStr;

    return(
        <header className="flex items-center h-[65px] bg-[#34495e] pl-6 pr-9 shrink-0 z-50 shadow-md">
            <div className="flex items-center gap-4 shrink-0">
                <Link href="/project">
                    <button className="text-white cursor-pointer hover:opacity-80 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </button>
                </Link>
                <span className="text-white font-semibold text-[18px] ml-5 truncate max-w-[200px]">
                    {projectName}
                </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-sm uppercase shadow-sm border border-white/10">
                    {user?.name ? user.name.charAt(0) : "U"}
                </div>

                <div className="flex flex-col justify-center">
                    {user?.name && (
                        <span className="text-white text-[14px] font-medium leading-tight">
                            {displayName}
                        </span>
                    )}
                    {user?.email && (
                        <span className="text-white/80 text-[12px] font-normal leading-tight mt-0.5">
                            {displayEmail}
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}