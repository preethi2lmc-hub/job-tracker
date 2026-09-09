"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-soft-cloud px-6">
      <h1 className="mb-2 whitespace-nowrap font-display text-[48px] leading-[0.9] tracking-tight text-ink uppercase sm:text-[64px] md:text-[96px]">
        Job Tracker
      </h1>
      <p className="mb-10 text-base text-mute">Log in to your account</p>

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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-[24px] bg-soft-cloud px-4 text-base text-ink outline-none transition focus:bg-canvas focus:ring-4 focus:ring-soft-cloud focus:border-2 focus:border-ink"
            />
          </div>

          {error && <p className="text-sm font-medium text-sale">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-[30px] bg-ink text-base font-medium text-canvas transition active:scale-[0.98] active:opacity-50 disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-mute">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
