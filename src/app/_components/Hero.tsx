import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroSectionProps {
    onCreateClick?: () => void;
}

export function HeroSection({ onCreateClick }: HeroSectionProps){
    return(
        <div className='relative mx-auto pt-[12rem] pb-[8rem] text-center w-full h-auto px-4'>
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-white"></div>
            
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className='mx-auto mb-[2rem] font-bold text-6xl md:text-7xl max-w-[60rem] leading-[1.1] text-gray-900 tracking-tight'
            >
                Optimize, <br/>
                Outperform
            </motion.h1>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className='text-lg md:text-xl mb-[4rem] text-gray-500 max-w-[40rem] mx-auto font-medium'
            >
                Design, simulate, and optimize your production lines effortlessly. Bridge the gap between planning and reality.
            </motion.div>

            <motion.button 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                onClick={onCreateClick} 
                className='text-lg text-white font-semibold bg-gray-900 px-[3rem] py-[1.25rem] rounded-full cursor-pointer hover:bg-gray-800 shadow-xl hover:shadow-2xl transition-all'
            >
                Get Started
            </motion.button>
        </div>
    )
} 