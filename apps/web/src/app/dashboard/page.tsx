import AppShell from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#1b579b]">
            BEOS · Bikash Engineering Pvt. Ltd.
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Overview of your company operations.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Projects</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">24</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Customers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">186</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">32</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Employees</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">50+</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Welcome to BEOS
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your central business operating system for projects, customers,
            inventory, accounting, HR, AI and IoT.
          </p>
        </div>
      </div>
    </AppShell>
  );
}