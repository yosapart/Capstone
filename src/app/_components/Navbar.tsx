"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface NavbarProps {
    onLoginClick?: () => void;
    onSignUpClick?: () => void;
}

interface UserInfo {
    name: string;
    email: string;
}

export function Navbar({ onLoginClick, onSignUpClick }: NavbarProps){
    const [user, setUser] = useState<UserInfo | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem("user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                setUser(null);
            }
        }

        // Listen for login/logout events from other components
        const handleStorage = () => {
            const s = sessionStorage.getItem("user");
            if (s) {
                try { setUser(JSON.parse(s)); } catch { setUser(null); }
            } else {
                setUser(null);
            }
        };

        window.addEventListener("storage", handleStorage);
        window.addEventListener("user-changed", handleStorage);
        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("user-changed", handleStorage);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout failed", e);
        }
        sessionStorage.removeItem("user");
        setUser(null);
        window.dispatchEvent(new Event("user-changed"));
    };

    return (
        <nav className='flex items-center text-[16px] font-bold max-w-full h-[65px] bg-[#34495e] sticky top-0 z-[1000]'>
            <Link href="/" className='block ml-[50px]'>
                <Image 
                    src="/FacSimLogo.png" 
                    alt="FacSim Logo" 
                    width={200}
                    height={18}
                    priority
                />
            </Link>

            <ul className="flex gap-[25px] ml-[auto] mr-[25px]">
                <li className="relative flex h-[65px] w-[130px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        Features
                    </Link>
                </li>
                
                <li className="relative flex h-[65px] w-[170px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        How it Works
                    </Link>
                </li>

                <li className="relative flex h-[65px] w-[130px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        About Us
                    </Link>
                </li>
            </ul>

            {user ? (
                /* ✅ Login แล้ว → แสดงชื่อ, email, ปุ่ม Logout */
                <div className='flex items-center ml-[40px] mr-[60px] gap-[20px]'>
                    <div className="flex items-center gap-3">
                        {/* Avatar วงกลม */}
                        <div className="w-9 h-9 rounded-full bg-[#1594dd] flex items-center justify-center text-white font-bold text-sm uppercase">
                            {user.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-white text-sm font-semibold">{user.name}</span>
                            <span className="text-gray-300 text-xs">{user.email}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className='text-sm text-white bg-red-500/80 px-5 py-2 rounded-full hover:bg-red-600 transition-all'
                    >
                        Logout
                    </button>
                </div>
            ) : (
                /* ❌ ยังไม่ login → แสดง Sign up / Login */
                <ul className='flex items-center ml-[40px] mr-[60px] gap-[30px]'>
                    <li>
                        <button onClick={onSignUpClick} className='text-lg text-white hover:underline hover:underline-offset-3 hover:decoration-2'>
                            Sign up
                        </button>
                    </li>

                    <li>
                        <button onClick={onLoginClick} className='text-lg text-white bg-[#1594dd] px-10 py-2 rounded-full hover:bg-[#1973c8] transition-all'>
                            Login
                        </button>
                    </li>
                </ul>
            )}
        </nav>
    )
};