import { useState, useEffect } from 'react';
import { type Project } from "../../_global_components/ProjectCard";

interface WelcomeProps {
    user: {
        user_id: number;
        name: string;
        email: string;
    } | null;
    loadingProjects: boolean;
    userProjects: Project[];
}

export default function Welcome({ user, loadingProjects, userProjects }: WelcomeProps) {
    const nameStr = user?.name || "";
    const displayName = (nameStr.length > 16) 
        ? nameStr.substring(0, 15) + "..." 
        : nameStr;

    const [randomSubtitle, setRandomSubtitle] = useState('');

    const subtitles = [
        "Start simulating and optimizing your production line today.",
        "Ready to design and improve your factory layout?",
        "Simulate, analyze, and refine for optimal results.",
        "Manage production lines and simulate scenarios for maximum efficiency."
    ];

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * subtitles.length);
        setRandomSubtitle(subtitles[randomIndex]);
    }, []);

    return (
        <section className="flex justify-between items-start ">
            <div>
                <h2 className="font-bold text-[26px] " >Welcome, {displayName}</h2>
                <p className="text-[16px] text-gray-600 mt-2">{randomSubtitle}</p>   
            </div>
            
            <div className="bg-[#ffffff] p-5 pt-3 pl-4 rounded-[10px] w-50 text-[18px] font-medium ">
                Total Projects 
                <p className="mt-3 text-[35px] ">
                    {loadingProjects ? "..." : userProjects.length}
                </p>
            </div>
          </section>
    );
}