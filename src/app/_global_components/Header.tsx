"use client";

import Link from "next/link";
import Image from "next/image";

interface UserInfo {
    name?: string;
    email?: string;
}

interface HeaderProps {
    user: UserInfo | null;
}

export function Header({ user }: HeaderProps){
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
      <Link href="/home" className="shrink-0 mr-6">
        <Image src="/FacSimLogo.png" alt="FacSim Logo" width={140} height={16} priority />
      </Link>

      <div className="flex items-center gap-3 ml-auto mr-2 shrink-0">
        <div className="w-10.5 h-10.5 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-sm uppercase">
          {user?.name ? user.name.charAt(0) : "U"}
        </div>
        <div className="flex flex-col">
          {user?.name && (
            <span className="text-white text-sm font-medium">
              {displayName}
            </span>
          )}
          {user?.email && (
            <span className="text-white/80 text-[12px] font-normal leading-tight mt-0.5">{displayEmail}</span>
          )}
              
        </div>
              
      </div>
    </header>
  )
}