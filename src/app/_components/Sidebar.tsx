import { IconHome, IconFolder, IconSettings, IconHelp, IconLogout } from "./Icons";

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menu: string) => void;
  onLogout: () => void;
}

export function Sidebar({ activeMenu, onMenuChange, onLogout }: SidebarProps) {
  return (
    <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col shrink-0">

      {/* Menu section */}
      <nav className="flex flex-col px-4 pt-6">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">Menu</span>

        <SidebarItem
          icon={<IconHome />}
          label="Home"
          active={activeMenu === "home"}
          onClick={() => onMenuChange("home")}
        />
        <SidebarItem
          icon={<IconFolder />}
          label="Projects"
          active={activeMenu === "projects"}
          onClick={() => onMenuChange("projects")}
        />
      </nav>

      {/* Divider */}
      <div className="mx-6 my-4 border-t border-gray-200" />

      {/* General section */}
      <nav className="flex flex-col px-4">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">General</span>

        <SidebarItem icon={<IconSettings />} label="Setting" onClick={() => {}} />
        <SidebarItem icon={<IconHelp />} label="Help" onClick={() => {}} />
        <SidebarItem
          icon={<IconLogout />}
          label="Logout"
          onClick={onLogout}
          danger
        />
      </nav>

      {/* Spacer */}
      <div className="flex-1" />
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
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all mb-1
        ${active
          ? "bg-[#1594dd]/10 text-[#1594dd]"
          : danger
            ? "text-red-500 hover:bg-red-50"
            : "text-gray-600 hover:bg-gray-100"
        }
      `}
    >
      {icon}
      {label}
    </button>
  );
}
