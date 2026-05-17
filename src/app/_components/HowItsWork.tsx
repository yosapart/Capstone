'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const STEPS = [
    {
        id: 1,
        title: 'Drag & Drop Layout',
        description: 'Place conveyor blocks freely onto your digital canvas.',
        imgSrc: '/Drag & Drop Layout.png',
    },
    {
        id: 2,
        title: 'Run Simulation',
        description: 'Input your production data to calculate material flow and instantly pinpoint bottlenecks.',
        imgSrc: '/Run Simulation.png',
    },
    {
        id: 3,
        title: 'Export & Share',
        description: 'Generate professional reports with full cost and time breakdowns, ready for your team.',
        imgSrc: '/Export & Share.png',
    },
];

export function HowItsWorks(){
    const [activeIndex, setActiveIndex] = useState(0);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % STEPS.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return(
        <section id="how-it-works" className='flex flex-col text-white w-[76%] h-200 mx-auto my-[5rem] rounded-[25px] bg-[#34495E] p-14 gap-[3rem] scroll-mt-[130px]'>
            <div>
                <h1 className='text-5xl font-bold mb-2 '>How it Works</h1>
                <h2 className='text-[18px] '>Start simulating and improving your factory in 3 easy steps.</h2>
            </div>

            <div className='flex justify-center items-center w-full'>
                <div className='relative w-full h-[380px] rounded-xl overflow-hidden shadow-2xl border border-white/10'>
                
                {STEPS.map((step, index) => {
                    const isActive = index === activeIndex;
                    return (
                    <div
                        key={`img-${step.id}`}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                        isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                    >
                        <Image
                        src={step.imgSrc}
                        fill
                        className="object-cover object-[center_30%]"
                        alt={step.title}
                        priority={index === 0}
                        />
                    </div>
                    );
                })}
                
                </div>
            </div>

            <div className='grid grid-cols-3 gap-6 w-full'>
                {STEPS.map((step, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <div 
                            key={step.id} 
                            className="flex flex-col gap-4 cursor-pointer group"
                            onClick={() => setActiveIndex(index)}
                        >
                            {/* บังคับ Re-render เส้นใหม่ทุกครั้งด้วย key={activeIndex} */}
                            <div 
                                key={`line-${activeIndex}-${index}`} 
                                className="w-full h-[7px] bg-white/10 rounded-full overflow-hidden relative"
                            >
                                {isActive ? (
                                    // ใช้สไตล์แบบ Inline Animation ยิงตรงเข้าสู่เลเยอร์ CSS เพื่อให้มันเริ่มนับ 0->100% ทุกครั้งที่สร้างก้อนนี้ขึ้นมาใหม่
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-[#1594DD] origin-left"
                                        style={{
                                            animation: 'loadingBar 5s linear forwards'
                                        }}
                                    />
                                ) : (
                                    <div className="absolute top-0 left-0 h-full w-0 bg-[#1594DD]" />
                                )}
                            </div>

                            {/* เขียน CSS Keyframe เล็กๆ แปะไว้ในใจกลางแอนิเมชัน */}
                            <style>{`
                                @keyframes loadingBar {
                                    from { width: 0%; }
                                    to { width: 100%; }
                                }
                            `}</style>

                            {/* ข้อความคำอธิบาย */}
                            <div className={`text-center transition-all duration-500 ${
                                isActive ? 'opacity-100 scale-[1.02]' : 'opacity-30 group-hover:opacity-60'
                            }`}>
                                <h3 className='text-[17px] font-bold my-2'>{step.title}</h3>
                                <p className='text-[14px] leading-relaxed'>{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
        </section>
    )
}