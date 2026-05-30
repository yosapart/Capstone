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
    <header className="flex items-center h-16.25 bg-white border-b border-gray-200 pl-6 pr-9 shrink-0 z-50">
      <Link href="/home" className="shrink-0 mr-6 flex items-center gap-2">
        <Image src="/logo.png" alt="FacSim Logo" width={36} height={36} priority className="opacity-90 hover:opacity-100 transition-opacity" />
        <span className="font-bold text-xl tracking-tight text-gray-900">FacSim</span>
      </Link>

      <div className="flex items-center gap-3 ml-auto mr-2 shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-gray-500">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex flex-col">
          {user?.name && (
            <span className="text-gray-900 text-sm font-bold">
              {displayName}
            </span>
          )}
          {user?.email && (
            <span className="text-gray-500 text-[12px] font-medium leading-tight mt-0.5">{displayEmail}</span>
          )}
              
        </div>
              
      </div>
    </header>
  )
}