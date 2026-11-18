
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createUsageRecord,
  getSubscribers,
  getUsageRecords,
} from "@/lib/api";
import type {
  CreateUsagePayload,
  Subscriber,
  UsageRecord,
} from "@/types";

type Tab = "overview" | "subscribers" | "usage";

const navigation: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "subscribers", label: "Subscribers", icon: "♙" },
  { id: "usage", label: "Usage Records", icon: "▤" },
];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatActivationDate = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) return value;

  const [, year, month, day] = match;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatMB = (value: number) => {
  if (value >= 1024) {
    return `${(value / 1024).toFixed(2)} GB`;
  }

  return `${formatNumber(value)} MB`;
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentDate, setCurrentDate] = useState("");
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubscriber, setSelectedSubscriber] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    subscriberId: "",
    callMinutes: "",
    smsCount: "",
    dataUsageMB: "",
  });

  // Set tanggal setelah komponen ter-mount di browser.
  // Ini mencegah error prerender akibat new Date() saat render.
  useEffect(() => {
    setCurrentDate(new Date().toISOString());
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [subscriberData, usageData] = await Promise.all([
        getSubscribers(),
        getUsageRecords(),
      ]);

      setSubscribers(subscriberData);
      setRecords(usageData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    if (selectedSubscriber === "all") return records;

    return records.filter(
      (record) => record.subscriberId === selectedSubscriber
    );
  }, [records, selectedSubscriber]);

  const statistics = useMemo(
    () => ({
      subscribers: subscribers.length,
      callMinutes: records.reduce(
        (total, record) => total + record.callMinutes,
        0
      ),
      smsCount: records.reduce(
        (total, record) => total + record.smsCount,
        0
      ),
      dataUsageMB: records.reduce(
        (total, record) => total + record.dataUsageMB,
        0
      ),
    }),
    [subscribers, records]
  );

  const getSubscriberName = (id: string) =>
    subscribers.find((subscriber) => subscriber.subscriber_id === id)?.name ?? id;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    const values = [
      form.callMinutes,
      form.smsCount,
      form.dataUsageMB,
    ];

    if (!form.subscriberId) {
      setFormError("Please select a subscriber.");
      return;
    }

    if (values.some((value) => value.trim() === "")) {
      setFormError("All usage fields are required.");
      return;
    }

    const numbers = values.map(Number);

    if (numbers.some((value) => !Number.isFinite(value) || value < 0)) {
      setFormError("Usage values must be valid non-negative numbers.");
      return;
    }

    if (numbers.some((value) => !Number.isInteger(value))) {
      setFormError("Usage values must be whole numbers.");
      return;
    }

    const payload: CreateUsagePayload = {
      subscriberId: form.subscriberId,
      callMinutes: numbers[0],
      smsCount: numbers[1],
      dataUsageMB: numbers[2],
    };

    setSubmitting(true);

    try {
      await createUsageRecord(payload);

      setForm({
        subscriberId: "",
        callMinutes: "",
        smsCount: "",
        dataUsageMB: "",
      });

      setShowModal(false);
      setSuccessMessage("Usage record added successfully.");

      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Failed to create usage record."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stats = [
    {
      label: "Total Subscribers",
      value: formatNumber(statistics.subscribers),
      description: "Registered subscribers",
      icon: "♙",
    },
    {
      label: "Call Minutes",
      value: formatNumber(statistics.callMinutes),
      description: "Total recorded minutes",
      icon: "☎",
    },
    {
      label: "SMS Messages",
      value: formatNumber(statistics.smsCount),
      description: "Total SMS sent",
      icon: "▤",
    },
    {
      label: "Data Usage",
      value: formatMB(statistics.dataUsageMB),
      description: "Total recorded data",
      icon: "◈",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                Subscriber Usage
              </h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>

          <div className="px-4 py-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Workspace
            </p>

            <nav className="space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                    activeTab === item.id
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-100 p-5">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-700">
                API Service
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    error
                      ? "bg-red-500"
                      : loading
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                />
                <span className="text-xs text-slate-500">
                  {error
                    ? "Connection error"
                    : loading
                      ? "Checking..."
                      : "Data loaded"}
                </span>
              </div>
              <p className="mt-3 break-all text-[10px] text-slate-400">
                {process.env.NEXT_PUBLIC_API_URL ?? "localhost:3000"}
              </p>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 lg:hidden">
                  Subscriber Usage /
                </span>
                <h2 className="text-lg font-bold tracking-tight">
                  {navigation.find((item) => item.id === activeTab)?.label}
                </h2>
              </div>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Monitor and manage subscriber usage activity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void loadData()}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <span>↻</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => {
                  setFormError("");
                  setShowModal(true);
                }}
                className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-700"
              >
                <span className="text-base">+</span>
                Add Usage
              </button>
            </div>
          </header>

          {/* Mobile navigation */}
          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold ${
                  activeTab === item.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-[1500px] space-y-7 p-5 sm:p-8">
            {/* Page introduction */}
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Dashboard
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {activeTab === "overview"
                    ? "Welcome back"
                    : activeTab === "subscribers"
                      ? "Subscriber Management"
                      : "Usage Records"}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  {activeTab === "overview"
                    ? "Here is an overview of your subscriber activity."
                    : activeTab === "subscribers"
                      ? "View all registered subscribers and their plans."
                      : "Review recorded subscriber usage transactions."}
                </p>
              </div>

              <div className="text-xs text-slate-400">
                {currentDate ? formatDate(currentDate) : "Loading date..."}
              </div>
            </section>

            {/* Error */}
            {error && (
              <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700">
                    Unable to load dashboard data
                  </p>
                  <p className="mt-1 text-xs text-red-600">{error}</p>
                </div>
                <button
                  onClick={() => void loadData()}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-medium text-emerald-700">
                  ✓ {successMessage}
                </p>
                <button
                  onClick={() => setSuccessMessage("")}
                  className="text-sm text-emerald-600"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Overview */}
            {activeTab === "overview" && (
              <>
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-500">
                          {stat.label}
                        </p>
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-600">
                          {stat.icon}
                        </span>
                      </div>
                      <p className="mt-5 text-2xl font-bold tracking-tight">
                        {loading ? "—" : stat.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {stat.description}
                      </p>
                    </div>
                  ))}
                </section>

                {/* Quick summary */}
                <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold">
                          Subscriber Overview
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          Distribution by subscription plan
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab("subscribers")}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        View all →
                      </button>
                    </div>

                    <div className="mt-6 space-y-5">
                      {(["Basic", "Premium", "Family"] as const).map(
                        (plan) => {
                          const count = subscribers.filter(
                            (subscriber) => subscriber.plan === plan
                          ).length;

                          const percentage =
                            subscribers.length > 0
                              ? (count / subscribers.length) * 100
                              : 0;

                          return (
                            <div key={plan}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-600">
                                  {plan}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {count} subscribers
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-slate-800 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-bold">Usage Summary</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Recorded transactions
                    </p>

                    <div className="mt-6 space-y-5">
                      <div>
                        <p className="text-xs text-slate-400">
                          Total usage records
                        </p>
                        <p className="mt-1 text-2xl font-bold">
                          {loading ? "—" : formatNumber(records.length)}
                        </p>
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs text-slate-400">
                          Average data per record
                        </p>
                        <p className="mt-1 text-xl font-bold">
                          {loading || records.length === 0
                            ? "—"
                            : formatMB(
                                statistics.dataUsageMB / records.length
                              )}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Recent usage */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
                    <div>
                      <h3 className="text-sm font-bold">
                        Recent Usage Records
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Latest recorded subscriber activity
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("usage")}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      View all →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <UsageTable
                      records={records.slice(0, 5)}
                      getSubscriberName={getSubscriberName}
                      loading={loading}
                    />
                  </div>
                </section>
              </>
            )}

            {/* Subscribers */}
            {activeTab === "subscribers" && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold">All Subscribers</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {subscribers.length} registered subscribers
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {[
                          "Subscriber ID",
                          "Name",
                          "Subscription Plan",
                          "Activation Date",
                        ].map((heading) => (
                          <th
                            key={heading}
                            className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400"
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <LoadingRow columns={4} />
                      ) : subscribers.length === 0 ? (
                        <EmptyRow
                          columns={4}
                          message="No subscribers found."
                        />
                      ) : (
                        subscribers.map((subscriber) => (
                          <tr key={subscriber.subscriber_id}>
                            <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                              {subscriber.subscriber_id}
                            </td>
                            <td className="px-5 py-4 text-sm font-medium">
                              {subscriber.name}
                            </td>
                            <td className="px-5 py-4">
                              <PlanBadge plan={subscriber.plan} />
                            </td>
                            <td className="px-5 py-4 text-xs text-slate-500">
                              {formatActivationDate(subscriber.activation_date)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Usage records */}
            {activeTab === "usage" && (
              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-sm font-bold">Usage Records</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {filteredRecords.length} records found
                    </p>
                  </div>

                  <select
                    value={selectedSubscriber}
                    onChange={(event) =>
                      setSelectedSubscriber(event.target.value)
                    }
                    className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none focus:border-slate-400"
                  >
                    <option value="all">All Subscribers</option>
                    {subscribers.map((subscriber) => (
                      <option
                        key={subscriber.subscriber_id}
                        value={subscriber.subscriber_id}
                      >
                        {subscriber.name} ({subscriber.subscriber_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <UsageTable
                    records={filteredRecords}
                    getSubscriberName={getSubscriberName}
                    loading={loading}
                  />
                </div>
              </section>
            )}

            <footer className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-400 sm:flex-row">
              <p>Subscriber Usage Management System</p>
              <p>Powered by Next.js &amp; Express API</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Add Usage Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) {
              setShowModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Add Usage Record</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter the subscriber usage information below.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Subscriber
                </label>
                <select
                  required
                  value={form.subscriberId}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      subscriberId: event.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">Select a subscriber</option>
                  {subscribers.map((subscriber) => (
                    <option
                      key={subscriber.subscriber_id}
                      value={subscriber.subscriber_id}
                    >
                      {subscriber.name} ({subscriber.subscriber_id})
                    </option>
                  ))}
                </select>
              </div>

              {[
                {
                  key: "callMinutes",
                  label: "Call Minutes",
                  placeholder: "e.g. 45",
                },
                {
                  key: "smsCount",
                  label: "SMS Count",
                  placeholder: "e.g. 20",
                },
                {
                  key: "dataUsageMB",
                  label: "Data Usage (MB)",
                  placeholder: "e.g. 1500",
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    {field.label}
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        [field.key]: event.target.value,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-slate-500"
                  />
                </div>
              ))}

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-xs text-red-600">
                  {formError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                  className="h-11 rounded-lg border border-slate-200 px-5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || subscribers.length === 0}
                  className="h-11 rounded-lg bg-slate-900 px-6 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Usage Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanBadge({ plan }: { plan: Subscriber["plan"] }) {
  const styles: Record<Subscriber["plan"], string> = {
    Basic: "bg-slate-100 text-slate-600",
    Premium: "bg-blue-50 text-blue-700",
    Family: "bg-violet-50 text-violet-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${styles[plan]}`}
    >
      {plan}
    </span>
  );
}

function UsageTable({
  records,
  getSubscriberName,
  loading,
}: {
  records: UsageRecord[];
  getSubscriberName: (id: string) => string;
  loading: boolean;
}) {
  return (
    <table className="w-full min-w-[760px] text-left">
      <thead className="bg-slate-50">
        <tr>
          {[
            "Subscriber",
            "Call Minutes",
            "SMS Count",
            "Data Usage",
            "Timestamp",
          ].map((heading) => (
            <th
              key={heading}
              className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {loading ? (
          <LoadingRow columns={5} />
        ) : records.length === 0 ? (
          <EmptyRow columns={5} message="No usage records found." />
        ) : (
          records.map((record) => (
            <tr key={record.id} className="transition hover:bg-slate-50/70">
              <td className="px-5 py-4">
                <p className="text-xs font-semibold text-slate-800">
                  {getSubscriberName(record.subscriberId)}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {record.subscriberId}
                </p>
              </td>
              <td className="px-5 py-4 text-xs text-slate-600">
                {formatNumber(record.callMinutes)} min
              </td>
              <td className="px-5 py-4 text-xs text-slate-600">
                {formatNumber(record.smsCount)}
              </td>
              <td className="px-5 py-4 text-xs font-semibold text-slate-700">
                {formatMB(record.dataUsageMB)}
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                {formatDate(record.timestamp)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function LoadingRow({ columns }: { columns: number }) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="px-5 py-12 text-center text-xs text-slate-400"
      >
        Loading data...
      </td>
    </tr>
  );
}

function EmptyRow({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) {
  return (
    <tr>
      <td
        colSpan={columns}
        className="px-5 py-12 text-center text-xs text-slate-400"
      >
        {message}
      </td>
    </tr>
  );
}
