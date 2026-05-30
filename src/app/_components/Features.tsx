"use client";
import { motion, Variants } from 'framer-motion';

export function Features(){
    const staggerVariants: Variants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    return(
        <div id="features" className='flex flex-col w-full max-w-7xl mx-auto my-40 px-6 lg:px-12 gap-32 scroll-mt-32.5'>
            
            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerVariants}
                className='flex flex-col md:flex-row items-center justify-between gap-12 w-full'
            >
                <div className='w-full md:w-[45%]'>
                    <h1 className='mb-6 font-bold text-4xl lg:text-5xl max-w-120 leading-tight text-gray-900 tracking-tight'> 
                        Visualize Your Factory Layout with Precision
                    </h1>
                    <p className='text-lg lg:text-xl max-w-md text-gray-500 leading-relaxed font-medium'>
                        Design machine placements and workstations optimized for your specific space to achieve maximum operational efficiency.
                    </p>
                </div>

                <div className='w-full md:w-[55%] aspect-video bg-gray-50 rounded-4xl overflow-hidden shadow-2xl relative border border-gray-200 group'>
                    <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                    <video 
                        src="/videos/start.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover" 
                    />
                </div>
            </motion.section> 
            
            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerVariants}
                className='flex flex-col md:flex-row-reverse items-center justify-between gap-12 mt-8 w-full'
            >
                <div className='w-full md:w-[45%] md:pl-12'>
                    <h1 className='mb-6 font-bold text-4xl lg:text-5xl max-w-120 leading-tight text-gray-900 tracking-tight'> 
                        Advanced Flow Dynamics Simulation
                    </h1>
                    <p className='text-lg lg:text-xl max-w-md text-gray-500 leading-relaxed font-medium'>
                        Visualize your operations and predict outcomes with our advanced simulation engine.
                    </p>
                </div>
                
                <div className='w-full md:w-[55%] aspect-video bg-gray-50 rounded-4xl overflow-hidden shadow-2xl relative border border-gray-200 group'>
                    <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                    <video 
                        src="/videos/optimize.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover" 
                    />
                </div>
            </motion.section>

            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerVariants}
                className='flex flex-col md:flex-row items-center justify-between gap-12 mt-8 w-full'
            >
                <div className='w-full md:w-[45%]'>
                    <h1 className='mb-6 font-bold text-4xl lg:text-5xl max-w-120 leading-tight text-gray-900 tracking-tight'> 
                        Production-Ready Documentation
                    </h1>
                    <p className='text-lg lg:text-xl max-w-md text-gray-500 leading-relaxed font-medium'>
                        Turn your results into professional documentation for stakeholders and engineers.
                    </p>
                </div>

                <div className='w-full md:w-[55%] aspect-video bg-gray-50 rounded-4xl overflow-hidden shadow-2xl relative border border-gray-200 group'>
                    <div className="absolute inset-0 bg-gray-900/5 group-hover:bg-transparent transition-colors z-10 pointer-events-none"></div>
                    <video 
                        src="/videos/pdf.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-cover" 
                    />
                </div>
            </motion.section>
            
        </div>
    )
}