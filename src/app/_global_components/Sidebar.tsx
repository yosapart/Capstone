import { useState } from 'react';
import { IconHome, IconFolder, IconHelp } from "../_components/Icons";
import { Settings, LogOut } from 'lucide-react';
import { useRouter } from "next/navigation";
import { usePathname } from 'next/navigation';

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col shrink-0">

      <nav className="flex flex-col px-4 pt-6">
        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</span>

        <SidebarItem
          icon={<IconHome />}
          label="Home"
          active={pathname === "/home"}
          onClick={() => onMenuChange("home")}
        />
        <SidebarItem
          icon={<IconFolder />}
          label="Project"
          active={pathname === "/project"}
          onClick={() => onMenuChange("project")}
        />
      </nav>

      <div className="mx-6 my-4 border-t border-gray-200" />

      <nav className="flex flex-col px-4">
        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">General</span>
        
        <SidebarItem
          icon={<IconHelp />}
          label="Help"
          active={pathname === "/help"}
          onClick={() => onMenuChange("help")}
        />
      </nav>
      
      <div className="mt-auto px-4 pb-5 flex flex-col gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowLogout(!showLogout)} 
            className="flex items-center w-full gap-4 px-4 py-3.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all text-sm font-semibold cursor-pointer"
          >
            <Settings size={20} /><span>Setting</span>
          </button>
          
          {showLogout && (
            <div className="absolute left-0 bottom-full mb-2 w-full bg-[#ffffff] border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
              <button 
                onClick={onLogout} 
                className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/10 text-[14px] font-bold transition-colors cursor-pointer  rounded-xl border border-black/5"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ───── Sidebar Item ───── */
function SidebarItem({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const router = useRouter()
  
    return (
      <button
        onClick={()=>{
          const lowerLabel = label.toLowerCase();
          if (lowerLabel !== "logout") {
            const path = lowerLabel === "home" ? "/home" : `/${lowerLabel}`;
            router.push(path);
          }
          onClick();
        }}
        className={`
          flex text-[14px] items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-1 cursor-pointer
          ${active
            ? "bg-[#5d88bd]/15 text-[#5d88bd]"
            : danger
              ? "text-red-500 hover:bg-red-50"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }
      ` }
      >
        {icon}
        {label}
      </button>
    );
  }