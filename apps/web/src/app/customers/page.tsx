"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  status?: string | null;
  createdAt?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Nepal",
    status: "Active",
  });

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/customers`);

      if (!response.ok) {
        throw new Error("Failed to load customers");
      }

      const data = await response.json();

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to connect to the API. Make sure the backend is running on port 3001.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Customer name and email are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create customer");
      }

      setForm({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "Nepal",
        status: "Active",
      });

      setShowForm(false);

      await loadCustomers();
    } catch (err) {
      console.error(err);
      setError("Could not create the customer.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      await loadCustomers();
    } catch (err) {
      console.error(err);
      setError("Could not delete the customer.");
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const text = [
      customer.name,
      customer.email,
      customer.phone,
      customer.city,
      customer.country,
      customer.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              BEOS / CRM
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage customers, contact information and customer status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowForm(true);
            }}
            className="rounded-xl bg-[#153d70] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#10345f]"
          >
            + Add Customer
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Customers</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {customers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Active Customers</p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {
                customers.filter(
                  (customer) => customer.status === "Active",
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Cities</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {
                new Set(
                  customers
                    .map((customer) => customer.city)
                    .filter(Boolean),
                ).size
              }
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customers by name, email, phone or city..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Customer table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Location
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center"
                    >
                      <div className="text-4xl">👥</div>

                      <p className="mt-3 font-semibold text-slate-800">
                        No customers found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add your first customer to get started.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {customer.name}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          ID: {customer.id}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-700">
                          {customer.email}
                        </div>

                        <div className="mt-1 text-sm text-slate-500">
                          {customer.phone || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-slate-700">
                          {customer.city || "—"}
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          {customer.country || "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            customer.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : customer.status === "Blocked"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {customer.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => deleteCustomer(customer.id)}
                          className="rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add customer modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Customer
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter customer information below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={createCustomer}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Full Name *
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Email *
                </label>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm({ ...form, email: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Phone
                </label>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="+977 98XXXXXXXX"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  City
                </label>

                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Pokhara"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Country
                </label>

                <input
                  value={form.country}
                  onChange={(event) =>
                    setForm({ ...form, country: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    setForm({ ...form, address: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Full address"
                />
              </div>

              <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#153d70] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}