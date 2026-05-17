interface CloseSectionProps {
    onCreateClick?: () => void;
}

export function CloseSection({ onCreateClick }: CloseSectionProps){
    return(
        <div className='mx-auto py-[9rem] text-center w-[auto] h-[35rem]'>
            <h1 className='mx-auto mb-[1.5rem] font-bold text-4xl w-[45%] leading-tight'>
                Future-Proof Your Production Line.
            </h1>
            <div className='text-xl mb-[5rem]'>
                Your most efficient factory layout is just a few clicks away.
            </div>
            <button 
                onClick={onCreateClick} 
                className='text-xl text-white font-bold bg-[#34495e] px-[3.5rem] py-[1.25rem] rounded-[15px] cursor-pointer hover:bg-[#1973c8] transition-all'
            >
                Try FacSim for Free
            </button>
        </div>
    )
}