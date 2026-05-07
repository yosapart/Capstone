import { useEffect, useState } from "react";
import styles from "@/app/project/[id]/_components/Toast.module.css"

interface ToastItem {
  id: number;
  message: string;
}

export const ToastContainer = ({ toasts }: { toasts: ToastItem[] }) => {
    const [isMounted, setIsMounted] = useState(false);

        useEffect(() => {
            setIsMounted(true);
        }, []);

        if (!isMounted) return null;

    return (
        <div className={styles.container}>
            {toasts.map((toast) => (
                <div 
                    key={toast.id} 
                    className={styles.toastItem}
                >
                    <div className="bg-[#1e293b] text-white shadow-2xl border border-slate-700/50 rounded-2xl px-5 py-3 flex items-center gap-3 w-[375px]">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="18" height="18" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="#f87171" 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="shrink-0 drop-shadow-sm"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <span className="text-[16px] font-medium tracking-wide">
                            {toast.message}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};