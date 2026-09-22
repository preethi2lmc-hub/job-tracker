"use client";

import { useEffect, useState } from "react";
import { FIELD, LABEL } from "./ApplicationForm";
import Dialog, { type DialogState } from "./Dialog";
import type { ApplicationStatus } from "@/lib/types";
import type { JobSearchResult } from "@/app/api/jobs/search/route";

type QuickAddResult =
  | { ok: true; alreadyExists: boolean }
  | { ok: false; error: string };

export default function JobSearch({
  onQuickAdd,
  trackedJobUrls,
}: {
  onQuickAdd: (job: JobSearchResult, status: "Wishlist" | "Applied") => Promise<QuickAddResult>;
  trackedJobUrls: Map<string, ApplicationStatus>;
}) {
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<JobSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.location) setLocation(data.location);
      })
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) {
      setError("Enter a location to search.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    // Remember this location for next time - fire and forget.
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    }).catch(() => {});

    const params = new URLSearchParams({ location });
    if (keyword.trim()) params.set("q", keyword.trim());

    const res = await fetch(`/api/jobs/search?${params}`);
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Job search failed. Please try again.");
      return;
    }

    setResults(await res.json());
  }

  function closeDialog() {
    setDialog(null);
  }

  function showInfo(title: string, message: string) {
    setDialog({ title, message, confirmLabel: "OK", onConfirm: closeDialog });
  }

  async function handleWishlistClick(job: JobSearchResult) {
    const existingStatus = trackedJobUrls.get(job.url);
    if (existingStatus) {
      showInfo(
        "Already added",
        `"${job.title}" is already in your tracker as ${existingStatus}.`
      );
      return;
    }

    const result = await onQuickAdd(job, "Wishlist");
    if (!result.ok) {
      showInfo("Couldn't add job", result.error);
      return;
    }
    showInfo(
      result.alreadyExists ? "Already added" : "Added to your wishlist",
      result.alreadyExists
        ? `"${job.title}" is already in your tracker.`
        : `"${job.title}" at ${job.company} has been added to your wishlist.`
    );
  }

  function handleApplyClick(job: JobSearchResult) {
    const existingStatus = trackedJobUrls.get(job.url);
    if (existingStatus === "Applied") {
      showInfo("Already applied", `You've already marked "${job.title}" as applied.`);
      return;
    }

    setDialog({
      title: "Apply for this job?",
      message: `Mark "${job.title}" at ${job.company} as applied? This only updates your tracker — you'll still need to submit the actual application via "View posting".`,
      confirmLabel: "Yes, mark as applied",
      cancelLabel: "Cancel",
      onConfirm: () => void confirmApply(job),
    });
  }

  async function confirmApply(job: JobSearchResult) {
    setDialog((d) => (d ? { ...d, submitting: true } : d));
    const result = await onQuickAdd(job, "Applied");

    if (!result.ok) {
      showInfo("Couldn't update job", result.error);
      return;
    }
    showInfo(
      result.alreadyExists ? "Already applied" : "Marked as applied",
      result.alreadyExists
        ? `"${job.title}" is already in your tracker.`
        : `"${job.title}" at ${job.company} is now marked as Applied.`
    );
  }

  return (
    <div>
      {dialog && <Dialog dialog={dialog} onClose={closeDialog} />}

      <form onSubmit={handleSearch} className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className={LABEL}>Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bangalore, India"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>Job title / role (optional)</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. frontend engineer, product manager"
            className={FIELD}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-12 rounded-[30px] bg-ink px-8 text-base font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm font-medium text-sale">{error}</p>}

      {results && results.length === 0 && !error && (
        <p className="mt-6 border border-hairline bg-soft-cloud px-8 py-10 text-center text-sm text-mute">
          No jobs currently listed near &ldquo;{location}&rdquo; in our search source. Try a nearby larger city, a broader keyword, or check back later — new postings are added constantly.
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="mt-6">
          {results.map((job) => {
            const tracked = trackedJobUrls.get(job.url);
            return (
              <li
                key={job.id}
                className="flex flex-col justify-between gap-4 border-b border-hairline py-6 sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <h3 className="text-base font-medium text-ink">{job.title}</h3>
                  <p className="mt-1 text-sm text-mute">{job.company}</p>
                  <p className="mt-1 text-xs text-stone">{job.location}</p>
                  {job.url && (
                    <a
                      href={job.url}
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
                    onClick={() => handleWishlistClick(job)}
                    className={`h-10 rounded-[30px] px-6 text-sm font-medium transition active:scale-[0.98] active:opacity-50 ${
                      tracked
                        ? "border border-hairline bg-canvas text-mute"
                        : "bg-soft-cloud text-ink"
                    }`}
                  >
                    {tracked ? "✓ In tracker" : "+ Wishlist"}
                  </button>
                  <button
                    onClick={() => handleApplyClick(job)}
                    className={`h-10 rounded-[30px] px-6 text-sm font-medium transition active:scale-[0.98] active:opacity-50 ${
                      tracked === "Applied" ? "border border-hairline bg-canvas text-mute" : "bg-ink text-canvas"
                    }`}
                  >
                    {tracked === "Applied" ? "✓ Applied" : "Apply"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
