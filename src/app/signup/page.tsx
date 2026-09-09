"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email to confirm your account before logging in.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-cloud px-6">
      <h1 className="mb-2 whitespace-nowrap font-display text-[48px] leading-[0.9] tracking-tight text-ink uppercase sm:text-[64px] md:text-[96px]">
        Job Tracker
      </h1>
      <p className="mb-10 text-base text-mute">Create your account</p>

      <div className="w-full max-w-sm bg-canvas p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-mute">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-[24px] bg-soft-cloud px-4 text-base text-ink outline-none transition focus:bg-canvas focus:ring-4 focus:ring-soft-cloud focus:border-2 focus:border-ink"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-mute">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-[24px] bg-soft-cloud px-4 text-base text-ink outline-none transition focus:bg-canvas focus:ring-4 focus:ring-soft-cloud focus:border-2 focus:border-ink"
            />
          </div>

          {error && <p className="text-sm font-medium text-sale">{error}</p>}
          {message && <p className="text-sm font-medium text-success">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-[30px] bg-ink text-base font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-mute">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
