import Image from 'next/image';

export function DesignSection(){
    return(
        <div className='pt-[5rem] pb-[28em] flex h-[28rem]'>
            <div className='ml-[20rem] mt-[3.5rem] w-[38%]'>
                <h1 className='mb-[1.5rem] font-bold text-4xl w-[60%] leading-tight'> 
                    Visualize Your Factory Layout with Precision
                </h1>
                <div className='text-xl w-[65%] text-gray-900'>
                    Design machine placements and workstations optimized for your specific space to achieve maximum operational efficiency.
                </div>
            </div>
            <div className='bg-[#34495E] w-[25%] h-[22rem]'>
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