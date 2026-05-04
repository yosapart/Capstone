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
    const [user, setUser] = useState<UserInfo | null>(null);
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
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="relative w-full h-64 rounded-lg mb-8 bg-cover bg-center"
                    style={{ backgroundImage: 'url(/dai.png)',
                        backgroundSize: '65%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}> {/*รูปแม่ง generate มาอย่างโง่ โค้ดนี้เก็บไว้ก็ได้เพราะเผื่อเอารูปมาใช้ */ }   
                </div> 

                <h1 className="text-3xl md:text-5xl font-bold mb-4 md:mb-8 text-center text-[#34495e]">
                    Need help? We've got your back.
                </h1>
                    <div>
                        <h2 className="text-base md:text-base mb-7 md:mb-14 text-center text-[#555]">
                            helping people who's get struggle with "I don't know where should I go next".
                        </h2>
                    </div>

                <div className="flex flex-col items-center justify-center">
                    {/* center title */}
                    {/* two column layout   */}
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full max-w-4xl lg:max-w-6xl px-2 md:px-4">
                        {/* left side */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="space-y-6 text-[#555]">
                                <section>
                                    <h1 className="text-2xl md:text-3xl font-semibold text-[#34495e] mb-2">
                                        How to create a project?
                                    </h1>
                                    <p className="text-sm md:text-base leading-relaxed">
                                        Start by clicking "Create Project" and then enter a name for your project. This will take you to the editor where you can start building your flow.
                                    </p>
                                </section>
                            </div>
                        </div>

                        {/* right side*/}
                        <div className="flex-1 flex items-center justify-center">
                            <Image
                                src="/code.png"
                                alt="Help Illustration"
                                width={300}
                                height={300}
                                className="object-contain w-48 md:w-96"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full max-w-4xl lg:max-w-6xl px-2 md:px-4 mt-8 md:mt-12">
                        {/* left side */}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="space-y-6 text-[#555]">
                                <section>
                                    <Image
                                src="/code.png"
                                alt="Help Illustration"
                                width={400}
                                height={400}
                                className="object-contain"
                            />
                                </section>
                            </div>
                        </div>

                        {/* right side*/}
                        <div className="flex-1 flex flex-col justify-center">
                            <h1 className="text-3xl font-semibold text-[#34495e] mb-2">
                                        How to delete my old project?
                                    </h1>
                                    <p className="text-base leading-relaxed">
                                        To delete a project, go to the project list and click on the delete icon next to the project you want to delete. Please note that this action is irreversible.
                                    </p>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 w-full max-w-4xl lg:max-w-6xl px-2 md:px-4">
                        {/* left side*/}
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="space-y-6 text-[#555]">
                                <section>
                                    <h1 className="text-2xl md:text-3xl font-semibold text-[#34495e] mb-2">
                                    How to edit my project?
                                    </h1>
                                    <p className="text-sm md:text-base leading-relaxed">
                                        To edit a project, simply click on the project card from your project list. This will take you to the editor where you can make changes to your flow. Remember to save your changes before exiting the editor.
                                    </p>
                                </section>
                            </div>
                        </div>

                        {/* right side*/}
                        <div className="flex-1 flex items-center justify-center">
                            <Image
                                src="/code.png"
                                alt="Help Illustration"
                                width={300}
                                height={300}
                                className="object-contain w-48 md:w-96"
                            />
                        </div>
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
}
