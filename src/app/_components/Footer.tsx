import Link from 'next/link';
import Image from 'next/image';

export function Footer(){
    return(
        <footer className='bg-white border-t border-gray-200 pt-24 pb-12 px-6 lg:px-12'>
            <div className='max-w-7xl mx-auto flex flex-col md:flex-row justify-between'>
                
                <div className='mb-12 md:mb-0'>
                    <Link href="/" className='flex items-center gap-2 mb-8'>
                        <Image 
                            src="/logo.png" 
                            alt="FacSim Logo Icon" 
                            width={40}
                            height={40}
                            priority
                            className="opacity-90 hover:opacity-100 transition-opacity"
                        />
                        <span className="font-bold text-xl tracking-tight text-gray-900">FacSim</span>
                    </Link>
            
                    <div>
                        <div className='text-md text-gray-900 font-bold mb-6'>
                            Social   
                        </div>
                        
                        <ul className='flex gap-6'>
                            <li>
                                <Link href='/' className="opacity-50 hover:opacity-100 transition-opacity">
                                    <Image src="/x.png" alt="X Logo" width={24} height={24} />
                                </Link>
                            </li>
                            <li>
                                <Link href='/' className="opacity-50 hover:opacity-100 transition-opacity">
                                    <Image src="/facebook.png" alt="Facebook Logo" width={24} height={24} />
                                </Link>
                            </li>
                            <li>
                                <Link href='/' className="opacity-50 hover:opacity-100 transition-opacity">
                                    <Image src="/ig.png" alt="Instragram Logo" width={24} height={24} />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className='flex flex-wrap md:flex-nowrap gap-12 md:gap-24'>
                    <div>
                        <h2 className='text-md text-gray-900 font-bold mb-6'>Docs</h2>
                        <ul className='flex flex-col gap-4 text-gray-500 font-medium'>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Introduction</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Getting Started</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>API Reference</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h2 className='text-md text-gray-900 font-bold mb-6'>Resources</h2>
                        <ul className='flex flex-col gap-4 text-gray-500 font-medium'>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Blog</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Help Center</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Community</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h2 className='text-md text-gray-900 font-bold mb-6'>Legal</h2>
                        <ul className='flex flex-col gap-4 text-gray-500 font-medium'>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Privacy Policy</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Terms of Service</Link></li>
                            <li className='hover:text-[#5d88bd] transition-colors'><Link href=''>Security</Link></li>
                        </ul>
                    </div>
                </div> 
            </div>
            
            <div className='border-t border-gray-200 mt-[5rem] pt-[2rem] flex flex-col md:flex-row justify-between items-center'>
                <p className='text-gray-400 text-sm font-medium'>
                    ©2026 FacSim. All rights reserved.
                </p>
            </div>
        </footer>
    )
}