"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import ApplicationForm, { toFormValues, type ApplicationFormValues } from "./ApplicationForm";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  Wishlist: "bg-gray-100 text-gray-700",
  Applied: "bg-blue-100 text-blue-700",
  Interviewing: "bg-amber-100 text-amber-700",
  Offer: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function Dashboard({ userEmail }: { userEmail: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "All">("All");

  useEffect(() => {
    void loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setApplications(data as Application[]);
    }
    setLoading(false);
  }

  async function handleAdd(values: ApplicationFormValues) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("applications").insert({
      ...values,
      location: values.location || null,
      experience_level: values.experience_level || null,
      date_applied: values.date_applied || null,
      job_url: values.job_url || null,
      salary_range: values.salary_range || null,
      notes: values.notes || null,
      user_id: user.id,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setShowAddForm(false);
    await loadApplications();
  }

  async function handleUpdate(id: string, values: ApplicationFormValues) {
    const { error } = await supabase
      .from("applications")
      .update({
        ...values,
        location: values.location || null,
        experience_level: values.experience_level || null,
        date_applied: values.date_applied || null,
        job_url: values.job_url || null,
        salary_range: values.salary_range || null,
        notes: values.notes || null,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    await loadApplications();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this application? This cannot be undone.")) return;

    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await loadApplications();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const filtered = useMemo(
    () =>
      statusFilter === "All"
        ? applications
        : applications.filter((a) => a.status === statusFilter),
    [applications, statusFilter]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: applications.length };
    for (const s of APPLICATION_STATUSES) {
      c[s] = applications.filter((a) => a.status === s).length;
    }
    return c;
  }, [applications]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            JOB TRACKER
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["All", ...APPLICATION_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                  statusFilter === s
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
                }`}
              >
                {s} ({counts[s] ?? 0})
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            {showAddForm ? "Close" : "+ Add application"}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {showAddForm && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Add application
            </h2>
            <ApplicationForm submitLabel="Add application" onSubmit={handleAdd} />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No applications yet. Click &ldquo;+ Add application&rdquo; to start tracking.
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((app) =>
              editingId === app.id ? (
                <li
                  key={app.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h2 className="mb-4 text-lg font-medium text-gray-900">
                    Edit application
                  </h2>
                  <ApplicationForm
                    initialValues={toFormValues(app)}
                    submitLabel="Save changes"
                    onSubmit={(values) => handleUpdate(app.id, values)}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              ) : (
                <li
                  key={app.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {app.job_title}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[app.status]}`}
                      >
                        {app.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{app.company}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {[app.location, app.experience_level, app.salary_range]
                        .filter(Boolean)
                        .join(" · ")}
                      {app.date_applied ? ` · Applied ${app.date_applied}` : ""}
                    </p>
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-xs text-blue-600 underline"
                      >
                        View posting
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setEditingId(app.id)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
