import { motion } from 'framer-motion';

interface CloseSectionProps {
    onCreateClick?: () => void;
}

export function CloseSection({ onCreateClick }: CloseSectionProps){
    return(
        <div className='mx-auto py-[8rem] text-center w-full px-4'>
            <div className="bg-gray-900 rounded-[3rem] py-[8rem] px-4 max-w-6xl mx-auto shadow-2xl overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                
                <h1 className='mx-auto mb-[2rem] font-bold text-5xl md:text-6xl max-w-[45rem] leading-tight text-white tracking-tight relative z-10'>
                    Future-Proof Your Production Line.
                </h1>
                
                <div className='text-xl md:text-2xl mb-[4rem] text-gray-300 font-medium relative z-10'>
                    Your most efficient factory layout is just a few clicks away.
                </div>
                
                <button 
                    onClick={onCreateClick} 
                    className='relative z-10 text-lg text-white font-bold bg-black border border-gray-700 px-[4rem] py-[1.25rem] rounded-full cursor-pointer hover:bg-gray-800 hover:scale-105 shadow-xl transition-all'
                >
                    Try FacSim for Free
                </button>
            </div>
        </div>
    )
}