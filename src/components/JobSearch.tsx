"use client";

import { useEffect, useState } from "react";
import { FIELD, LABEL } from "./ApplicationForm";
import type { JobSearchResult } from "@/app/api/jobs/search/route";

export default function JobSearch({
  onQuickAdd,
}: {
  onQuickAdd: (job: JobSearchResult, status: "Wishlist" | "Applied") => Promise<void>;
}) {
  const [location, setLocation] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<JobSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingKey, setAddingKey] = useState<string | null>(null);

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

  async function handleQuickAdd(job: JobSearchResult, status: "Wishlist" | "Applied") {
    setAddingKey(`${job.id}-${status}`);
    await onQuickAdd(job, status);
    setAddingKey(null);
  }

  return (
    <div>
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
          <label className={LABEL}>Keyword (optional)</label>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. frontend, product manager"
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
          {results.map((job) => (
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
                  onClick={() => handleQuickAdd(job, "Wishlist")}
                  disabled={addingKey !== null}
                  className="h-10 rounded-[30px] bg-soft-cloud px-6 text-sm font-medium text-ink transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
                >
                  {addingKey === `${job.id}-Wishlist` ? "Adding…" : "+ Wishlist"}
                </button>
                <button
                  onClick={() => handleQuickAdd(job, "Applied")}
                  disabled={addingKey !== null}
                  className="h-10 rounded-[30px] bg-ink px-6 text-sm font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
                >
                  {addingKey === `${job.id}-Applied` ? "Adding…" : "+ Applied"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
