"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";
import ApplicationForm, { toFormValues, type ApplicationFormValues } from "./ApplicationForm";

const STATUS_COLOR: Record<ApplicationStatus, string> = {
  Wishlist: "text-mute",
  Applied: "text-ink",
  Interviewing: "text-info",
  Offer: "text-success",
  Rejected: "text-sale",
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
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-3 px-6 py-4">
          <h1 className="whitespace-nowrap font-display text-3xl uppercase tracking-tight text-ink">
            Job Tracker
          </h1>
          <div className="flex items-center gap-4">
            <span className="truncate text-sm text-mute">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="h-10 shrink-0 rounded-[30px] bg-soft-cloud px-6 text-sm font-medium whitespace-nowrap text-ink transition active:scale-[0.98] active:opacity-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(["All", ...APPLICATION_STATUSES] as const).map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`h-10 rounded-[30px] border px-4 text-sm font-medium transition ${
                    active
                      ? "border-ink bg-ink text-canvas"
                      : "border-hairline bg-canvas text-ink"
                  }`}
                >
                  {s} ({counts[s] ?? 0})
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="h-12 rounded-[30px] bg-ink px-8 text-base font-medium text-canvas transition active:scale-[0.98] active:opacity-50"
          >
            {showAddForm ? "Close" : "+ Add application"}
          </button>
        </div>

        {error && (
          <p className="mb-6 border border-hairline px-4 py-3 text-sm font-medium text-sale">
            {error}
          </p>
        )}

        {showAddForm && (
          <div className="mb-10 border-b border-hairline pb-10">
            <h2 className="mb-6 text-xl font-medium text-ink">Add application</h2>
            <ApplicationForm submitLabel="Add application" onSubmit={handleAdd} />
          </div>
        )}

        {loading ? (
          <p className="text-sm text-mute">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="border border-hairline bg-soft-cloud px-8 py-12 text-center text-sm text-mute">
            No applications yet. Click &ldquo;+ Add application&rdquo; to start tracking.
          </p>
        ) : (
          <ul>
            {filtered.map((app) =>
              editingId === app.id ? (
                <li key={app.id} className="border-b border-hairline py-8">
                  <h2 className="mb-6 text-xl font-medium text-ink">Edit application</h2>
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
                  className="flex flex-col justify-between gap-4 border-b border-hairline py-6 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-medium text-ink">{app.job_title}</h3>
                      <span className={`text-xs font-medium uppercase tracking-wide ${STATUS_COLOR[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-mute">{app.company}</p>
                    <p className="mt-1 text-xs text-stone">
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
                        className="mt-2 inline-block text-xs font-medium text-ink underline underline-offset-2"
                      >
                        View posting
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => setEditingId(app.id)}
                      className="h-10 rounded-[30px] bg-soft-cloud px-6 text-sm font-medium text-ink transition active:scale-[0.98] active:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="h-10 rounded-[30px] border border-hairline px-6 text-sm font-medium text-sale transition active:scale-[0.98] active:opacity-50"
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
