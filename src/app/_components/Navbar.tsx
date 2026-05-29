"use client";
import Link from 'next/link';
import Image from 'next/image';
import AuthModal from './AuthModal';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
    onLoginClick?: () => void;
    onSignUpClick?: () => void;
}

interface UserInfo {
    name: string;
    email: string;
}

export function Navbar({ onLoginClick, onSignUpClick }: NavbarProps) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [modeState, setModeState] = useState<'login' | 'register'>('login');

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const stored = sessionStorage.getItem("user");
        if (stored) {
            try { setUser(JSON.parse(stored)); } catch { setUser(null); }
        }

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

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
        if (pathname === "/") {
            e.preventDefault();
            const element = document.getElementById(targetId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (pathname === "/about-us") {
            e.preventDefault();
            router.push(`/#${targetId}`);
            setTimeout(() => {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 150);
        }
    };

    return (
        <>
        <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className='flex items-center text-[15px] font-semibold max-w-full h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[1000] px-[5%] lg:px-[10%]'
        >
            <Link href="/" className='flex items-center gap-2'>
                <Image
                    src="/logo.png"
                    alt="FacSim Logo Icon"
                    width={36}
                    height={36}
                    priority
                    className="opacity-90 hover:opacity-100 transition-opacity" 
                />
                <span className="font-bold text-xl tracking-tight text-gray-900">FacSim</span>
            </Link>

            <ul className="flex gap-[32px] ml-auto mr-[40px]">
                <li>
                    <Link 
                        href="/#features" 
                        onClick={(e) => handleNavClick(e, 'features')}
                        className="text-gray-600 hover:text-[#5d88bd] transition-colors py-2 relative group font-medium"
                    >
                        Features
                        <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#5d88bd] transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/#how-it-works" 
                        onClick={(e) => handleNavClick(e, 'how-it-works')}
                        className="text-gray-600 hover:text-[#5d88bd] transition-colors py-2 relative group font-medium"
                    >
                        How it Works
                        <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#5d88bd] transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                </li>
                <li>
                    <Link 
                        href="/about-us" 
                        className="text-gray-600 hover:text-[#5d88bd] transition-colors py-2 relative group font-medium"
                    >
                        About Us
                        <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-[#5d88bd] transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                </li>
            </ul>

            <ul className='flex items-center gap-[12px]'>
                <li>
                    <button onClick={() => {
                        if (onLoginClick) { onLoginClick(); return; }
                        setModeState('login');
                        setShowAuth(true);
                    }} className='text-[15px] font-semibold text-gray-900 px-5 py-2.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer'>
                        Login
                    </button>
                </li>
                <li>
                    <button onClick={() => {
                        if (onSignUpClick) { onSignUpClick(); return; }
                        setModeState('register');
                        setShowAuth(true);
                    }} className='text-[15px] font-semibold text-white bg-gray-900 px-6 py-2.5 rounded-full cursor-pointer hover:bg-gray-800 transition-all shadow-md hover:shadow-lg'>
                        Sign up
                    </button>
                </li>
            </ul>
        </motion.nav>

        <AnimatePresence>
            {showAuth && (
                <AuthModal mode={modeState} onClose={() => setShowAuth(false)} />
            )}
        </AnimatePresence>
        </>
    )
}