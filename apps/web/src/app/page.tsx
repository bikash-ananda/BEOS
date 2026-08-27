import AppShell from "@/components/layout/AppShell";

export default function Home() {
  return (
    <AppShell>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#1b579b]">
            Bikash Engineering Pvt. Ltd. · Pokhara, Nepal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            BEOS Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Bikash Engineering Operating System — your central platform for
            company operations, projects, finance, people, AI and IoT.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Projects" value="24" />
          <DashboardCard title="Customers" value="186" />
          <DashboardCard title="Open Orders" value="32" />
          <DashboardCard title="Employees" value="50+" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-slate-900">
              Welcome to BEOS
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Select a module from the navigation to begin managing Bikash
              Engineering operations.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-900">
              System Status
            </h2>

            <div className="mt-5 space-y-4">
              <Status name="Web Application" />
              <Status name="API Server" />
              <Status name="PostgreSQL" />
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Status({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-600">{name}</span>

      <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Online
      </span>
    </div>
  );
}