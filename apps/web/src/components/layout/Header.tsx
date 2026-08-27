"use client";

type HeaderProps = {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  activeModule: string;
};

export default function Header({
  sidebarCollapsed,
  onToggleSidebar,
  activeModule,
}: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur transition-all duration-300 md:px-6 ${
        sidebarCollapsed ? "ml-20" : "ml-64"
      }`}
    >
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={
            sidebarCollapsed ? "Expand navigation" : "Collapse navigation"
          }
        >
          <span className="text-lg">☰</span>
        </button>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">
            {activeModule}
          </div>

          <div className="hidden text-xs text-slate-500 sm:block">
            BEOS · Bikash Engineering Pvt. Ltd.
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {/* Search */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Search"
          title="Search"
        >
          <span aria-hidden="true">⌕</span>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
          title="Notifications"
        >
          <span aria-hidden="true">🔔</span>

          <span
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"
            aria-label="Unread notifications"
          />
        </button>

        {/* Help */}
        <button
          type="button"
          className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
          aria-label="Help"
          title="Help"
        >
          ?
        </button>

        {/* Language */}
        <button
          type="button"
          className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 md:block"
        >
          EN / नेपाली
        </button>

        {/* User */}
        <button
          type="button"
          className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-[#1b579b] text-xs font-bold text-white transition hover:opacity-90"
          aria-label="Open user menu"
          title="User menu"
        >
          BE
        </button>
      </div>
    </header>
  );
}