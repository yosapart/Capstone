export function Features(){
    return(
        <div id="features" className='flex flex-col w-[75%] h-auto mx-auto my-[10rem] px-10 gap-[8rem] scroll-mt-[130px]'>
            <section className='flex flex-col md:flex-row items-center justify-between gap-10 w-full'>
                <div className='w-full md:w-[50%]'>
                    <h1 className='mb-[1.5rem] font-bold text-4xl max-w-[28rem] leading-tight text-gray-900'> 
                        Visualize Your Factory Layout with Precision
                    </h1>
                    <p className='text-xl max-w-[28rem] text-gray-600 leading-relaxed'>
                        Design machine placements and workstations optimized for your specific space to achieve maximum operational efficiency.
                    </p>
                </div>

                <div className='w-full xl:w-[39rem] aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative ring-6 ring-slate-100/50'>
                    <video 
                        src="/videos/start.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-contain" 
                    />
                </div>
            </section> 
            
            <section className='flex flex-col md:flex-row items-center justify-between gap-10 mt-[6rem] w-full'>
                <div className='w-full md:w-[50%]'>
                    <h1 className='mb-[1.5rem] font-bold text-4xl max-w-[28rem] leading-tight text-gray-900'> 
                        Advanced Flow Dynamics Simulation
                    </h1>
                    <p className='text-xl max-w-[28rem] text-gray-600 leading-relaxed'>
                        Visualize your operations and predict outcomes with our advanced simulation engine.
                    </p>
                </div>
                
                <div className='w-full xl:w-[39rem] aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative ring-6 ring-slate-100/50'>
                    <video 
                        src="/videos/optimize.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-contain" 
                    />
                </div>
            </section>

            <section className='flex flex-col md:flex-row items-center justify-between gap-10 mt-[6rem] w-full'>
                <div className='w-full md:w-[50%]'>
                    <h1 className='mb-[1.5rem] font-bold text-4xl max-w-[28rem] leading-tight text-gray-900'> 
                        Production-Ready Documentation
                    </h1>
                    <p className='text-xl max-w-[28rem] text-gray-600 leading-relaxed'>
                        Turn your results into professional documentation for stakeholders and engineers.
                    </p>
                </div>

                <div className='w-full xl:w-[39rem] aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative ring-6 ring-slate-100/50'>
                    <video 
                        src="/videos/pdf.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        preload="auto"
                        className="w-full h-full object-contain" 
                    />
                </div>
            </section>
            
        </div>
    )
}