"use client";
import Link from "next/link";

type SidebarProps = {
  collapsed: boolean;
  activeModule: string;
  onModuleChange: (module: string) => void;
};

const modules = [
  { name: "Overview", icon: "⌂", href: "/dashboard" },
  { name: "Company Workspace", icon: "▦", href: "/workspace" },
  { name: "Projects", icon: "◈", href: "/projects" },
  { name: "Customers", icon: "♙", href: "/customers" },
  { name: "Quotations", icon: "▤", href: "/quotations" },
  { name: "Sales & Orders", icon: "▣", href: "/orders" },
  { name: "Inventory", icon: "▥", href: "/inventory" },
  { name: "Accounting", icon: "৳", href: "/accounting" },
  { name: "Human Resources", icon: "♙", href: "/hr" },
  { name: "AI Center", icon: "✦", href: "/ai" },
  { name: "IoT Devices", icon: "⌁", href: "/iot" },
];
export default function Sidebar({
  collapsed,
  activeModule,
  onModuleChange,
}: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#153d70] text-lg font-bold text-white">
          B
        </div>

        {!collapsed && (
          <div className="ml-3 min-w-0">
            <div className="font-bold text-[#153d70]">BEOS</div>
            <div className="truncate text-[10px] text-slate-500">
              Bikash Engineering
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3">
        {modules.map((module) => {
          const isActive = activeModule === module.name;

          return (
            <button
              key={module.name}
              type="button"
              title={collapsed ? module.name : undefined}
              onClick={() => onModuleChange(module.name)}
              className={`mb-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-[#153d70] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <span className="grid w-7 shrink-0 place-items-center text-base">
                {module.icon}
              </span>

              {!collapsed && (
                <span className="ml-2 truncate">{module.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-3">
        <div
          className={`flex items-center rounded-xl bg-slate-50 p-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1b579b] text-sm font-bold text-white">
            BE
          </div>

          {!collapsed && (
            <div className="ml-2 min-w-0">
              <div className="truncate text-sm font-semibold">
                Bikash Engineering
              </div>
              <div className="text-xs text-slate-500">Administrator</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}