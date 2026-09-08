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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Job title *
        </label>
        <input
          required
          value={values.job_title}
          onChange={(e) => update("job_title", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Company *
        </label>
        <input
          required
          value={values.company}
          onChange={(e) => update("company", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          value={values.location}
          onChange={(e) => update("location", e.target.value)}
          placeholder="e.g. Remote, Bengaluru"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Experience level
        </label>
        <input
          value={values.experience_level}
          onChange={(e) => update("experience_level", e.target.value)}
          placeholder="e.g. 2-4 years, Entry level"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          value={values.status}
          onChange={(e) => update("status", e.target.value as ApplicationStatus)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        >
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Date applied
        </label>
        <input
          type="date"
          value={values.date_applied}
          onChange={(e) => update("date_applied", e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Job posting URL
        </label>
        <input
          type="url"
          value={values.job_url}
          onChange={(e) => update("job_url", e.target.value)}
          placeholder="https://…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Salary range
        </label>
        <input
          value={values.salary_range}
          onChange={(e) => update("salary_range", e.target.value)}
          placeholder="e.g. ₹12-16 LPA"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          value={values.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
