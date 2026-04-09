import Link from 'next/link';
import Image from 'next/image';

export function Navbar(){
    return (
        <nav className='flex items-center text-[16px] font-bold max-w-full h-[65px] bg-[#34495e] sticky top-0 z-[1000]'>
            <Link href="/" className='block ml-[50px]'>
                <Image 
                    src="/vercel.svg" 
                    alt="FacSim Logo" 
                    width={45}
                    height={18}
                    priority
                />
            </Link>

            <ul className="flex gap-[25px] ml-[auto] mr-[25px]">
                <li className="relative flex h-[65px] w-[130px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        Features
                    </Link>
                </li>
                
                <li className="relative flex h-[65px] w-[170px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        How it Works
                    </Link>
                </li>

                <li className="relative flex h-[65px] w-[130px] items-center justify-center
                               after:absolute after:bottom-0 after:left-1/2 after:h-[5px] after:w-0 
                               after:-translate-x-1/2 after:rounded-[10px] after:bg-[#e0e0e0]
                               after:transition-all after:duration-300 after:ease-in-out 
                               hover:after:w-full">
                    <Link href="/" className="flex h-full w-full text-lg items-center justify-center text-white hover:text-blue-400 transition-colors">
                        About Us
                    </Link>
                </li>
            </ul>

            <ul className='flex ml-[40px] mr-[60px] gap-[30px]'>
                <li>
                    <Link href="/" className='text-lg text-white hover:underline hover:underline-offset-3 hover:decoration-2'>
                        Sign up
                    </Link>
                </li>

                <li>
                    <Link href="/" className='text-lg text-white bg-[#1594dd] px-10 py-2 rounded-full hover:bg-[#1973c8] transition-all'>
                        Login
                    </Link>
                </li>
            </ul>
        </nav>
    )
};