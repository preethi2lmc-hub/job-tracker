// Fallback values so the app works even if the Vercel project's env vars
// haven't been set yet. Safe to keep in source: these are the anon/publishable
// key and project URL, which are meant to be public — access is enforced by
// Postgres Row Level Security, not by keeping this key secret.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bathjoqpadnolhizncdu.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_nfJiF5mpCHFtjjQRi0Ngnw_4yqWX9V2";
