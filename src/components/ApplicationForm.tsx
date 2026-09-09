"use client";

import { useState } from "react";
import { APPLICATION_STATUSES, type Application, type ApplicationStatus } from "@/lib/types";

export interface ApplicationFormValues {
  job_title: string;
  company: string;
  location: string;
  experience_level: string;
  status: ApplicationStatus;
  date_applied: string;
  job_url: string;
  salary_range: string;
  notes: string;
}

const EMPTY_FORM: ApplicationFormValues = {
  job_title: "",
  company: "",
  location: "",
  experience_level: "",
  status: "Wishlist",
  date_applied: "",
  job_url: "",
  salary_range: "",
  notes: "",
};

const FIELD =
  "h-12 w-full rounded-[24px] bg-soft-cloud px-4 text-base text-ink outline-none transition focus:bg-canvas focus:ring-4 focus:ring-soft-cloud focus:border-2 focus:border-ink";
const LABEL = "mb-2 block text-xs font-medium uppercase tracking-wide text-mute";

export function toFormValues(app?: Application): ApplicationFormValues {
  if (!app) return EMPTY_FORM;
  return {
    job_title: app.job_title,
    company: app.company,
    location: app.location ?? "",
    experience_level: app.experience_level ?? "",
    status: app.status,
    date_applied: app.date_applied ?? "",
    job_url: app.job_url ?? "",
    salary_range: app.salary_range ?? "",
    notes: app.notes ?? "",
  };
}

export default function ApplicationForm({
  initialValues = EMPTY_FORM,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: ApplicationFormValues;
  submitLabel: string;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<ApplicationFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ApplicationFormValues>(
    key: K,
    value: ApplicationFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div>
        <label className={LABEL}>Job title *</label>
        <input
          required
          value={values.job_title}
          onChange={(e) => update("job_title", e.target.value)}
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Company *</label>
        <input
          required
          value={values.company}
          onChange={(e) => update("company", e.target.value)}
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Location</label>
        <input
          value={values.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g. Remote, Bengaluru"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Experience level</label>
        <input
          value={values.experience_level}
          onChange={(e) => update("experience_level", e.target.value)}
          placeholder="e.g. 2-4 years, Entry level"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Status</label>
        <select
          value={values.status}
          onChange={(e) => update("status", e.target.value as ApplicationStatus)}
          className={FIELD}
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={LABEL}>Date applied</label>
        <input
          type="date"
          value={values.date_applied}
          onChange={(e) => update("date_applied", e.target.value)}
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Job posting URL</label>
        <input
          type="url"
          value={values.job_url}
          onChange={(e) => update("job_url", e.target.value)}
          placeholder="https://…"
          className={FIELD}
        />
      </div>
      <div>
        <label className={LABEL}>Salary range</label>
        <input
          value={values.salary_range}
          onChange={(e) => update("salary_range", e.target.value)}
          placeholder="e.g. ₹12-16 LPA"
          className={FIELD}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={LABEL}>Notes</label>
        <textarea
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-[24px] bg-soft-cloud px-4 py-3 text-base text-ink outline-none transition focus:bg-canvas focus:ring-4 focus:ring-soft-cloud focus:border-2 focus:border-ink"
        />
      </div>

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="h-12 rounded-[30px] bg-ink px-8 text-base font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-[30px] bg-soft-cloud px-8 text-base font-medium text-ink transition active:scale-[0.98] active:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
