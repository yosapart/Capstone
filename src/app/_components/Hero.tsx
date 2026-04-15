import Link from 'next/link';

interface HeroSectionProps {
    onCreateClick?: () => void;
}

export function HeroSection({ onCreateClick }: HeroSectionProps){
    return(
        <div className='mx-auto py-[9rem] text-center w-[auto] h-[40rem]'>
            <h1 className='mx-auto mb-[1.5rem] font-bold text-5xl w-[50rem] leading-tight'>
                Revolutionize Your Factory Production with Smart Simulation
            </h1>
            <div className='text-xl mb-[4.5rem]'>
                Design, simulate, and optimize your production lines effortlessly. Bridge the gap between planning and reality.
            </div>
            <button onClick={onCreateClick} className='text-xl text-white font-bold bg-[#34495e] px-[3.5rem] py-[1.25rem] rounded-[15px] hover:bg-[#1973c8] transition-all'>
                Get Started →
            </button>
        </div>
    )
} 