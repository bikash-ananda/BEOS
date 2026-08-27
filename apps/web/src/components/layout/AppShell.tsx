"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState("Overview");

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />

      <Header
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        activeModule={activeModule}
      />

      <main
        className={`min-h-[calc(100vh-4rem)] transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}