"use client";

import { useState } from "react";

const navigation = [
  {
    section: "MAIN",
    items: [{ name: "Dashboard", icon: "⌂" }],
  },
  {
    section: "COLLABORATION",
    items: [
      { name: "Discussions", icon: "▣" },
      { name: "Meetings", icon: "◷" },
      { name: "Announcements", icon: "📢" },
      { name: "Tasks", icon: "✓" },
    ],
  },
  {
    section: "BUSINESS",
    items: [
      { name: "Customers", icon: "♙" },
      { name: "Quotations", icon: "▤" },
      { name: "Projects", icon: "◆" },
      { name: "Services", icon: "⚡" },
    ],
  },
  {
    section: "OPERATIONS",
    items: [
      { name: "Inventory", icon: "▦" },
      { name: "Assets", icon: "♢" },
      { name: "Procurement", icon: "📦" },
    ],
  },
  {
    section: "FINANCE",
    items: [
      { name: "Invoices", icon: "📄" },
      { name: "Payments", icon: "💳" },
      { name: "Accounting", icon: "◈" },
    ],
  },
  {
    section: "PEOPLE",
    items: [
      { name: "Employees", icon: "👥" },
      { name: "HR", icon: "♧" },
    ],
  },
  {
    section: "INTELLIGENCE",
    items: [{ name: "AI Assistant", icon: "✦" }],
  },
];

const projects = [
  {
    name: "Smart Farming Model",
    client: "Bikash Engineering R&D",
    progress: 82,
    status: "Active",
    department: "R&D",
  },
  {
    name: "Wildlife Management System",
    client: "Government Project",
    progress: 64,
    status: "Active",
    department: "Government",
  },
  {
    name: "AI Assistance ToT",
    client: "Agriculture Technology",
    progress: 48,
    status: "Development",
    department: "AI/IoT",
  },
];

const activities = [
  {
    title: "Engineering team updated project progress",
    detail: "Smart Farming Model · Progress: 82%",
    time: "12 min ago",
    icon: "◆",
  },
  {
    title: "New quotation request received",
    detail: "Electrical Automation Project",
    time: "42 min ago",
    icon: "▤",
  },
  {
    title: "Inventory item received",
    detail: "Electronics Warehouse · 14 units",
    time: "1 hr ago",
    icon: "▦",
  },
  {
    title: "Service request assigned",
    detail: "IoT Integration Support",
    time: "2 hrs ago",
    icon: "⚡",
  },
];

const meetings = [
  {
    title: "Management & Engineering Review",
    date: "Today",
    time: "2:30 PM",
    participants: ["Sundar P.", "Ramesh S.", "Priya K."],
    department: "Management",
    status: "Scheduled",
  },
  {
    title: "Pokhara Wildlife Management Meeting",
    date: "Today",
    time: "4:00 PM",
    participants: ["Govind K.", "Anjali M.", "Dev R."],
    department: "Government Projects",
    status: "Scheduled",
  },
  {
    title: "AI/IoT Development Sync",
    date: "Tomorrow",
    time: "10:00 AM",
    participants: ["Bikash E.", "Rahul T.", "Nisha G."],
    department: "AI/IoT",
    status: "Scheduled",
  },
];

const discussions = [
  {
    author: "Engineering Department",
    avatar: "⚙",
    message: "Farm IoT prototype testing completed. Moving to beta phase.",
    timestamp: "2 hours ago",
    reactions: "👍 3 · ❤️ 1",
    comments: 5,
  },
  {
    author: "Project Team",
    avatar: "◆",
    message: "Pokhara wildlife management project meeting scheduled for today at 4 PM.",
    timestamp: "4 hours ago",
    reactions: "👍 7 · 🔥 2",
    comments: 12,
  },
  {
    author: "Management",
    avatar: "📊",
    message: "Monthly engineering review and Q3 planning session tomorrow. All leads, please come prepared.",
    timestamp: "1 day ago",
    reactions: "👍 12",
    comments: 8,
  },
];

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState("EN");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-[270px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[82px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 text-lg font-bold text-white shadow-sm">
            BE
          </div>

          <div className="min-w-0">
            <div className="font-bold tracking-tight">BEOS</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Bikash Engineering
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {navigation.map((group) => (
            <div key={group.section} className="mb-6">
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {group.section}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActive(item.name);
                      setMobileOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active === item.name
                        ? "bg-slate-950 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <span className="flex w-6 justify-center text-base">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-100 p-4">
          {/* AI Card */}
          <div className="mb-4 rounded-2xl bg-slate-950 p-4 text-white">
            <div className="mb-2 text-xs font-medium text-slate-400">
              BEOS AI
            </div>
            <p className="text-sm font-medium leading-5">
              Your engineering operations assistant.
            </p>
            <button className="mt-4 w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-100">
              Ask AI
            </button>
          </div>

          {/* Help & Settings */}
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <span className="flex w-6 justify-center text-base">❓</span>
            Help & Support
          </button>

          {/* User Profile */}
          <button className="mt-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:bg-slate-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white">
              BE
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">Bikash Engineering</div>
              <div className="text-xs text-slate-400">Administrator</div>
            </div>
          </button>

          {/* Logout */}
          <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">
            <span className="flex w-6 justify-center text-base">⬅</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <section className="lg:pl-[270px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[82px] items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
          {/* Left section */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-base font-semibold lg:hidden hover:bg-slate-50 transition"
              aria-label="Toggle sidebar"
            >
              ☰
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search projects, people, tasks..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm placeholder-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-300"
                  aria-label="Global search"
                />
                <span className="absolute right-3 top-2.5 text-slate-400 text-sm">🔍</span>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Branch selector */}
            <button
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              title="Current office branch"
            >
              📍 Pokhara
            </button>

            {/* Language selector */}
            <div className="relative group">
              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                title="Change language"
              >
                🌐 {language}
              </button>
              <div className="absolute right-0 mt-1 w-32 rounded-xl border border-slate-200 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50">
                <button
                  onClick={() => setLanguage("EN")}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    language === "EN" ? "bg-slate-100 font-semibold" : ""
                  } hover:bg-slate-50 first:rounded-t-xl`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("नेपाली")}
                  className={`w-full px-4 py-2 text-left text-sm ${
                    language === "नेपाली" ? "bg-slate-100 font-semibold" : ""
                  } hover:bg-slate-50 last:rounded-b-xl border-t border-slate-100`}
                >
                  नेपाली
                </button>
              </div>
            </div>

            {/* Notifications */}
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              aria-label="Notifications"
              title="3 new notifications"
            >
              🔔
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </button>

            {/* User profile */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white hover:from-blue-600 hover:to-blue-700 transition"
              aria-label="User profile"
              title="Bikash Engineering (Administrator)"
            >
              BE
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          {/* Greeting */}
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              {getGreeting()}
            </h1>
            <p className="mt-1 text-lg text-slate-600">
              Bikash Engineering Pvt. Ltd.
            </p>
          </div>

          {/* Subtitle */}
          <div className="mb-8 text-slate-600">
            <p>Company overview and today&rsquo;s activities</p>
          </div>

          {/* KPI cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
            {[
              ["24", "Active Projects", "+12% this month", "◆"],
              ["38", "Open Tasks", "8 due today", "✓"],
              ["6", "Upcoming Meetings", "2 today", "◷"],
              ["17", "Pending Quotations", "5 need review", "▤"],
            ].map(([value, title, detail, icon]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-base font-semibold">
                    {icon}
                  </div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {detail}
                  </span>
                </div>

                <div className="mt-5 text-4xl font-bold tracking-tight">
                  {value}
                </div>
                <div className="mt-1 text-sm text-slate-600 font-medium">{title}</div>
              </div>
            ))}
          </section>

          {/* Main grid */}
          <section className="grid gap-6 xl:grid-cols-3 mb-8">
            {/* Active Projects (left, spans 2 columns on xl) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h3 className="text-lg font-bold">Active Projects</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Current engineering and technology initiatives
                  </p>
                </div>

                <button className="text-xs font-semibold text-slate-600 hover:text-slate-950 transition">
                  View all →
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {projects.map((project) => (
                  <div key={project.name} className="px-6 py-5 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold">{project.name}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {project.client}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {project.department}
                        </p>
                      </div>

                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shrink-0">
                        {project.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-950 transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-semibold text-slate-600">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Meetings */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-bold">Upcoming Meetings</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Schedule for the week
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {meetings.map((meeting, idx) => (
                  <div key={idx} className="px-6 py-4 hover:bg-slate-50 transition">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold leading-tight">
                        {meeting.title}
                      </h4>
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 shrink-0 whitespace-nowrap">
                        {meeting.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-2">
                      {meeting.date} · {meeting.time}
                    </p>

                    <p className="text-xs text-slate-400 mb-2">
                      {meeting.department}
                    </p>

                    <div className="flex items-center gap-1">
                      {meeting.participants.map((participant, i) => (
                        <div
                          key={i}
                          className="h-6 w-6 rounded-full bg-slate-300 text-[10px] font-bold flex items-center justify-center text-white"
                          title={participant}
                        >
                          {participant.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Activity & Discussions */}
          <section className="grid gap-6 xl:grid-cols-2">
            {/* Company Activity */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-bold">Company Activity</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Recent activity across BEOS
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {activities.map((activity, idx) => (
                  <div key={idx} className="px-6 py-5 hover:bg-slate-50 transition">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-semibold text-slate-600">
                        {activity.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {activity.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {activity.detail}
                        </p>
                        <p className="mt-2 text-[10px] text-slate-400">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Discussions */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="text-lg font-bold">Company Discussions</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Department updates and announcements
                </p>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {discussions.map((discussion, idx) => (
                  <div key={idx} className="px-6 py-5 hover:bg-slate-50 transition">
                    <div className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-base font-semibold">
                        {discussion.avatar}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {discussion.author}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {discussion.timestamp}
                        </p>

                        <p className="mt-2 text-sm leading-5 text-slate-700">
                          {discussion.message}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                          <span>{discussion.reactions}</span>
                          <button className="hover:text-slate-950 transition">
                            💬 {discussion.comments} comments
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { icon: "◷", label: "New Meeting", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                { icon: "▣", label: "New Discussion", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                { icon: "▤", label: "New Quotation", color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
                { icon: "◆", label: "New Project", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                { icon: "⚡", label: "Service Request", color: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
              ].map(({ icon, label, color }) => (
                <button
                  key={label}
                  className={`flex flex-col items-center gap-2 rounded-xl px-4 py-4 font-semibold text-sm transition ${color}`}
                >
                  <span className="text-2xl">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 flex flex-col gap-3 border-t border-slate-200 py-7 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
            <div>
              © 2026 Bikash Engineering Pvt. Ltd. · Pokhara, Nepal
            </div>
            <div className="flex gap-5">
              <span>BEOS v0.1.0</span>
              <span>System Health: Optimal</span>
              <span>Last updated: Today</span>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}