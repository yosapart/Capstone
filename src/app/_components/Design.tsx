import Image from 'next/image';

export function DesignSection(){
    return(
        <div className='flex w-[78%] h-[29rem] items-center justify-center mx-auto mb-[2rem] px-10 gap-10'>
            <div className='w-[53%] mb-[2.5rem]'>
                <h1 className='mb-[1.5rem] font-bold text-4xl w-[25rem] leading-tight'> 
                    Visualize Your Factory Layout with Precision
                </h1>
                <div className='text-xl w-[28rem] text-gray-900'>
                    Design machine placements and workstations optimized for your specific space to achieve maximum operational efficiency.
                </div>
            </div>

            <div className='bg-[#34495E] w-[25rem] h-[20rem]'>
                จำลองรูปหรืออื่นๆที่จะใส่ไว้ก่อน
            </div>
            {/* <Image 
                src="/" 
                alt="" 
                width={200}
                height={18}
            /> */}
        </div>
    )
}