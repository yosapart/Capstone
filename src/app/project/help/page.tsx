"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useRef, useCallback, ReactNode } from "react";
import { motion, Variants } from "framer-motion";

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
    video: string;
    imageLeft: boolean;
    color: string;
    lightBg: string;
    midBg: string;
}

const HELP_SECTIONS: HelpSection[] = [
    {
        id: "createFlow",
        num: "01",
        title: "How to create a new flow?",
        body: 'Start by clicking "New Flow" and entering a name for your project. This will take you to the editor, where you can begin building your production flow.',
        video: "/videos/projectHelp/newflow.mp4",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "newBlock",
        num: "02",
        title: "How to add a new block?",
        body: "You can add a new block by clicking on the Start, Process, or End block on the left panel. Please note that you can only add one Start and one End block. You can add as many Process blocks as needed, but you must fill in the required information for each block first. Additionally, you must create a flow before you can place any blocks.",
        video: "/videos/projectHelp/addblock.mp4",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "editBlock",
        num: "03",
        title: "How to edit blocks?",
        body: "You can edit a block either by clicking directly on the block on the main screen or by using the Process tab on the right panel to modify its details.",
        video: "/videos/projectHelp/edit_block.mp4",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "formatBlock",
        num: "04",
        title: "How should I format the blocks?",
        body: "Whether you want to simulate, optimize, or generate a PDF, you must arrange the blocks in the correct order. The Start block must always be the first block, and the End block must always be the last block in your sequence.",
        video: "/videos/projectHelp/format_block.mp4",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "reorderBlock",
        num: "05",
        title: "How to reorder blocks?",
        body: 'When you add a new block, it will always be placed at the end of the sequence. To reorder your blocks, go to the Process tab on the right panel and simply drag and drop the blocks into your desired positions.',
        video: "/videos/projectHelp/reorder_block.mp4",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "simulate",
        num: "06",
        title: "How to simulate?",
        body: "You can run a simulation by clicking the Play button (green triangle) on the top menu bar. Ensure all required data is filled in, then click \"Start Simulation.\" The simulation results will appear in the Result tab on the right side. You can choose to watch the animation play out or skip directly to the final result.",
        video: "/videos/projectHelp/simulate.mp4",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "testcase",
        num: "07",
        title: "How to select a testcase?",
        body: "On the simulation screen, you can set up various test cases that might happen in your factory (e.g., increased electricity costs, a shortage of workers). Please note that the selected scenarios may or may not actually occur during the simulation.",
        video: "/videos/projectHelp/testcase.mp4",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "optimize",
        num: "08",
        title: "How to optimize the block?",
        body: "Click on the Optimize button to open the optimization window. Fill in the required information, and the system will generate and display the optimized results for you.",
        video: "/videos/projectHelp/optimize.mp4",
        imageLeft: true,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
    {
        id: "pdf",
        num: "09",
        title: "How to do PDF file?",
        body: "If you want to save your simulation results as a PDF to share with others, click the Download PDF button in the top right corner. The system will display a print preview page; from there, click Save PDF to download the file to your device.",
        video: "/videos/projectHelp/pdf.mp4",
        imageLeft: false,
        color: "#ffffff",
        lightBg: "#0d12147f",
        midBg: "rgba(28, 33, 37, 0.1)",
    },
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

    const [rawQuery, setRawQuery] = useState("");
    const [query, setQuery] = useState("");
    
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const staggerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
    };

    /* Auth */
    useEffect(() => {
        const stored = sessionStorage.getItem("user");
        if (!stored) { router.push("/"); return; }
        try { setUser(JSON.parse(stored)); } catch { router.push("/"); }
    }, [router]);

    // ----- แก้ไข: เช็คว่ามีค่าค่อย clear -----
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawQuery(val);
        // ----- แก้ไข: เช็คว่ามีค่าค่อย clear -----
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setQuery(val), 200);
    }, []);

    const matchSet = useMemo(() => getMatchSet(query), [query]);
    const isFiltering = query.trim().length > 0;

    if (!user) return null;

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

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <header className="flex items-center h-16.25 bg-white border-b border-gray-200 pl-6 pr-9 shrink-0 z-50">

                <button 
                    onClick={() => router.back()} 
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors group cursor-pointer bg-transparent border-none p-0 outline-none"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-x-0.5 transition-transform">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    <span className="text-[13.5px] font-medium tracking-wide">Back</span>
                </button>

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

            <div className="flex flex-1 overflow-hidden">

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

                        <div className="h-6 bg-linear-to-b from-white to-[#f0f2f5]" />
                    </div>

                    <div className="text-center px-4 pt-10 pb-6 md:pb-20">
                        <h1 className="text-3xl md:text-[2rem] font-bold mb-2.5 text-gray-900  tracking-tight">
                            Need help? We&apos;ve got your back.
                        </h1>
                        <p className="text-base md:text-[17px] text-[#888] max-w-sm mx-auto leading-relaxed">
                            Guides for everything you need to get the most out of the platform.
                        </p>
                    </div>

                    {/* Content Sections */}
                    <div className="flex flex-col w-full max-w-7xl mx-auto mb-40 px-6 lg:px-12 gap-50">
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

                                    <div 
                                        className="w-full md:w-[55%] aspect-video bg-gray-50 rounded-4xl overflow-hidden shadow-2xl relative border border-gray-200 group flex items-center justify-center"
                                        style={{ backgroundColor: section.lightBg }}
                                    >
                                        <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>

                                        <div
                                            className="relative z-10 rounded-2xl p-3"
                                        >
                                            <video
                                                src={section.video}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="object-contain w-full h-full drop-shadow-md rounded-lg"
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