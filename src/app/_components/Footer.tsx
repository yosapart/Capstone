import Link from 'next/link';
import Image from 'next/image';

export function Footer(){
    return(
        <div className='bg-[#34495e] h-[24rem] '>
            <div className='flex pt-[3rem] h-[19rem] '>
                <div className='ml-[5rem] '>
                    <Link href="/" className='mb-[2.5rem] inline-block '>
                        <Image 
                            src="/logo-w.png" 
                            alt="FacSim Logo" 
                            width={90}
                            height={18}
                            priority
                        />
                    </Link>
            
                    <div className='mt-[1rem]'>
                        <div className='text-xl text-white font-[500] mb-[0.5rem] '>
                            Social   
                        </div>
                        
                        <ul className='flex gap-[1.5rem] w-[10rem] '>
                            <li>
                                <Link href='/'>
                                    <Image 
                                        src="/x.png" 
                                        alt="X Logo" 
                                        width={200}
                                        height={18}
                                        priority
                                        className="invert brightness-200"
                                    />
                                </Link>
                            </li>
                            <li>
                                <Link href='/'>
                                    <Image 
                                        src="/facebook.png" 
                                        alt="Facebook Logo" 
                                        width={200}
                                        height={18}
                                        priority
                                        className="invert brightness-200"
                                    />
                                </Link>
                            </li>
                            <li>
                                <Link href='/'>
                                    <Image 
                                        src="/ig.png" 
                                        alt="Instragram Logo" 
                                        width={200}
                                        height={18}
                                        priority
                                        className="invert brightness-200"
                                    />
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className='flex text-white ml-[39%] '>
                    <div className='mr-[7%]'>
                        <h2 className='text-l text-gray-300 font-[500] mb-[1rem] '>
                            Docs
                        </h2>
                        <ul className='w-[160px] '>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Introduction</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Getting Started</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>API Reference</Link>
                            </li>
                        </ul>
                    </div>

                    <div className='mr-[7%]'>
                        <h2 className='text-l text-gray-300 font-[500] mb-[1rem] '>
                            Resources
                        </h2>
                        <ul className='w-[160px] '>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Blog</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Help Center</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Community</Link>
                            </li>
                        </ul>
                    </div>

                    <div className='mr-[7%]'>
                        <h2 className='text-l text-gray-300 font-[500] mb-[1rem] '>
                            Legal
                        </h2>
                        <ul className='w-[160px] '>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Privacy Policy</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Terms of Service</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Security</Link>
                            </li>
                        </ul>
                    </div>

                    <div className='mr-[7%] '>
                        <h2 className='text-l text-gray-300 font-[500] mb-[1rem] '>
                            About Us
                        </h2>
                        <ul className='w-[160px] '>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Our Story</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>The Team</Link>
                            </li>
                            <li className='mb-[0.25rem] hover:underline'>
                                <Link href=''>Contact Us</Link>
                            </li>
                        </ul>
                    </div>
                </div> 
            </div>
            
            <span className='block mx-auto w-[94%] h-[1px] bg-white opacity-50 ' />

            <p className='mt-[2rem] text-white text-l text-center w-full'>
                ©2026 FacSim. All rights reserved.
            </p>
        
        </div>
    )
}