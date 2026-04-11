import Image from 'next/image';

export function AnalyzeSection(){
    return(
        <div className='pt-[5rem] pb-[28rem] flex h-[28rem]'>
            <div className='bg-[#34495E] w-[25%] h-[22rem] ml-[20rem]'>
                จำลองรูปหรืออื่นๆที่จะใส่ไว้ก่อน
            </div>

            {/* <Image 
                src="/" 
                alt="" 
                width={200}
                height={18}
            /> */}

            <div className='ml-[15.5rem] mt-[3.5rem] w-[40%]'>
                <h1 className='mb-[1.5rem] font-bold text-4xl w-[55%] leading-tight'> 
                    Advanced Flow Dynamics Simulation
                </h1>
                <div className='text-xl w-[50%] text-gray-900'>
                    Visualize your operations and predict outcomes with our advanced simulation engine.
                </div>
            </div>
            
        </div>
    )
}