"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback, ReactNode } from "react";
import { motion, Variants } from "framer-motion";

import { Header } from "../_global_components/Header";
import { Sidebar } from "../_global_components/Sidebar";

interface UserInfo {
    user_id: number;
    name: string;
    email: string;
}

interface HelpSection {
    id: string;
    num: string;
    title: string;
    body: string;
    image: string;
    imageLeft: boolean;
    color: string;
    lightBg: string;
    midBg: string;
}

const HELP_SECTIONS: HelpSection[] = [
    {
        id: "create",
        num: "01",
        title: "How to create a project?",
        body: 'Start by clicking "Create Project" and enter a name for your project. This takes you to the editor where you can start building your production flow from scratch.',
        image: "/code.png",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "delete",
        num: "02",
        title: "How to delete my old project?",
        body: "To delete a project, go to the project list and click on the delete icon next to the project you want to remove. Please note this action is irreversible.",
        image: "/code.png",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "edit",
        num: "03",
        title: "How to edit my project?",
        body: "To edit a project, simply click on the project card from your list. This opens the editor where you can make changes to your flow. Remember to save before exiting.",
        image: "/code.png",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    /* ตัวอย่าง
    {
        id: "view",
        num: "04",
        title: "How to view my project?", 
        body: "To view a project, click on the project card from your list. This opens the editor where you can see your flow. You can also share the project with others by sharing the project link.",
        image: "/code.png",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    }
        */
];

/*Search*/

const SEARCH_INDEX = HELP_SECTIONS.map((s) => ({
    id: s.id,
    text: `${s.title} ${s.body}`.toLowerCase(),
}));

function getMatchSet(query: string): Set<string> {
    if (!query.trim()) return new Set(HELP_SECTIONS.map((s) => s.id));
    const terms = query.toLowerCase().trim().split(/\s+/);
    return new Set(
        SEARCH_INDEX
            .filter((e) => terms.some((t) => e.text.includes(t)))
            .map((e) => e.id)
    );
}

/*Text Highlightตอนเสิร์ช */

function highlight(text: string, query: string): ReactNode {
    if (!query.trim()) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark
                        key={i}
                        className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic font-semibold"
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

/* ─── Icons ──────────────────────────────────────────────────────────────────── */

const SearchIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);


/* Main Page */

export default function HelpPage() {
    const router = useRouter();
    const [user, setUser] = useState<UserInfo | null>(null);
    const [activeMenu, setActiveMenu] = useState("projects");

    const [rawQuery, setRawQuery] = useState("");
    const [query, setQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const staggerVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    /* Auth */
    useEffect(() => {
        const stored = sessionStorage.getItem("user");
        if (!stored) { router.push("/"); return; }
        try { setUser(JSON.parse(stored)); } catch { router.push("/"); }
    }, [router]);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem("user");
        window.dispatchEvent(new Event("user-changed"));
        router.push("/");
    }, [router]);

    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setQuery(val), 200);
    }, []);

    const clearSearch = useCallback(() => {
        setRawQuery("");
        setQuery("");
    }, []);

    const matchSet = useMemo(() => getMatchSet(query), [query]);
    const isFiltering = query.trim().length > 0;

    if (!user) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <Header user={user} />

            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    activeMenu={activeMenu}
                    onMenuChange={setActiveMenu}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto">

                    {/* Hero Section */}
                    <div className="relative bg-white">
                        <div
                            className="absolute inset-0"
                        />
                        <div
                            className="absolute inset-0 opacity-25"
                        />

                        <div
                            className="relative w-full"
                            style={{
                                height: 200,
                                backgroundImage: "url(/dai.png)",
                                backgroundSize: "50%",
                                backgroundPosition: "center 55%",
                                backgroundRepeat: "no-repeat",
                            }}
                        />

                        {/* Search bar  */}
                        <div className="relative px-4 pb-10 pt-4 flex flex-col items-center">

                            <div className="relative w-full max-w-lg">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                    <SearchIcon />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search topics — create, edit, delete…"
                                    value={rawQuery}
                                    onChange={handleQueryChange}
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="w-full pl-11 pr-11 py-3.5 bg-white border border-gray-200 rounded-2xl text-[13.5px] text-[#34495e] placeholder:text-gray-400 shadow-[0_2px_12px_rgba(0,0,0,0.07)] focus:outline-none focus:ring-2 focus:ring-[#5d88bd]/30 focus:border-[#5d88bd] transition-all duration-150"
                                />
                            </div>

                            {isFiltering && (
                                <p className="mt-2.5 text-[12px] text-gray-400">
                                    {matchSet.size === 0
                                        ? `No results for "${query}"`
                                        : `${matchSet.size} topic${matchSet.size !== 1 ? "s" : ""} matched`}
                                </p>
                            )}
                        </div>

                        <div className="h-6 bg-gradient-to-b from-white to-[#f0f2f5]" />
                    </div>

                    <div className="text-center px-4 pt-8 pb-6 md:pb-10">
                        <h1 className="text-3xl md:text-[2rem] font-bold mb-2.5 text-gray-900  tracking-tight">
                            Need help? We&apos;ve got your back.
                        </h1>
                        <p className="text-base md:text-[17px] text-[#888] max-w-sm mx-auto leading-relaxed">
                            Guides for everything you need to get the most out of the platform.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="flex flex-col w-full max-w-7xl mx-auto mb-40 px-6 lg:px-12 gap-32">
                        {HELP_SECTIONS.map((section) => {
                            const isMatch = matchSet.has(section.id);

                            return (
                                <motion.section
                                    key={section.id}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, margin: "-100px" }}
                                    variants={staggerVariants}
                                    className={`flex flex-col ${
                                        section.imageLeft ? "md:flex-row-reverse" : "md:flex-row"
                                    } items-center justify-between gap-12 w-full transition-all duration-300`}
                                    style={{
                                        opacity: isFiltering && !isMatch ? 0.15 : 1,
                                        transform: isFiltering && !isMatch ? "scale(0.97)" : "scale(1)",
                                        filter: isFiltering && !isMatch ? "grayscale(0.6)" : "none",
                                        pointerEvents: isFiltering && !isMatch ? "none" : "auto",
                                    }}
                                >
                                    {/* ── Text side ── */}
                                    <div className={`w-full md:w-[45%] ${section.imageLeft ? 'md:pl-12' : ''}`}>
                                        
                                        <h1 className="mb-6 font-bold text-4xl lg:text-5xl max-w-120 leading-tight text-gray-900 tracking-tight">
                                            {highlight(section.title, query)}
                                        </h1>
                                        
                                        <p className="text-lg lg:text-xl max-w-md text-gray-500 leading-relaxed font-medium">
                                            {highlight(section.body, query)}
                                        </p>
                                    </div>

                                    {/* Image side*/}
                                    <div 
                                        className="w-full md:w-[55%] aspect-video bg-gray-50 rounded-4xl overflow-hidden shadow-2xl relative border border-gray-200 group flex items-center justify-center"
                                        style={{ backgroundColor: section.lightBg }}
                                    >
                                        <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>

                                        {/* Image wrapper */}
                                        <div
                                            className="relative z-10 rounded-2xl p-6"
                                            style={{ backgroundColor: section.midBg }}
                                        >
                                            <Image
                                                src={section.image}
                                                alt={section.title}
                                                width={320}
                                                height={320}
                                                className="object-contain w-48 md:w-72 drop-shadow-md"
                                            />
                                        </div>
                                    </div>
                                </motion.section>
                            );
                        })}
                    </div>

                </main>
            </div>
        </div>
    );
}