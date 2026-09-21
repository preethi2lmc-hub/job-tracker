import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Edge-safe: uses only auth.config.ts (no MongoDB/bcrypt), so it can run in
// the Edge runtime that Next.js proxies/middleware execute in.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
