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
                <h2 className="font-bold text-[#34495e] text-[30px] " >Welcome, {displayName}</h2>
                <p className="text-[18px] text-gray-600 mt-2.5">{randomSubtitle}</p>   
            </div>
            
            <div className="bg-[#ffffff] text-[#34495e] p-3 pt-3 pl-4 rounded-[10px] w-50 text-[20px] font-semibold ">
                Total Projects 
                <p className="mt-1.75 text-[35px] text-[#34495e] font-medium ">
                    {loadingProjects ? "..." : userProjects.length}
                </p>
            </div>
          </section>
    );
}