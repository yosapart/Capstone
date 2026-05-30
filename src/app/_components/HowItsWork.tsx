'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

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
        <motion.section 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            id="how-it-works" 
            className='flex flex-col text-gray-900 w-full max-w-7xl mx-auto my-20 rounded-4xl bg-gray-50 border border-gray-200 p-8 lg:p-14 gap-12 scroll-mt-32.5 shadow-sm'
        >
            <div className="text-center">
                <h1 className='text-4xl lg:text-5xl font-bold mb-4 tracking-tight'>How it Works</h1>
                <h2 className='text-lg lg:text-xl text-gray-500 font-medium'>Start simulating and improving your factory in 3 easy steps.</h2>
            </div>

            <div className='flex justify-center items-center w-full'>
                <div className='relative w-full h-95 rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white'>
                
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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-4'>
                {STEPS.map((step, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <div 
                            key={step.id} 
                            className="flex flex-col gap-4 cursor-pointer group"
                            onClick={() => setActiveIndex(index)}
                        >
                            <div 
                                key={`line-${activeIndex}-${index}`} 
                                className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden relative"
                            >
                                {isActive ? (
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-[#5d88bd] origin-left"
                                        style={{
                                            animation: 'loadingBar 5s linear forwards'
                                        }}
                                    />
                                ) : (
                                    <div className="absolute top-0 left-0 h-full w-0 bg-[#5d88bd]" />
                                )}
                            </div>

                            <style>{`
                                @keyframes loadingBar {
                                    from { width: 0%; }
                                    to { width: 100%; }
                                }
                            `}</style>

                            <div className={`text-center md:text-left transition-all duration-500 ${
                                isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
                            }`}>
                                <h3 className='text-lg font-bold mb-2'>{step.title}</h3>
                                <p className='text-sm lg:text-[15px] leading-relaxed text-gray-600 font-medium'>{step.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
        </motion.section>
    )
}