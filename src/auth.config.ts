import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by proxy.ts (no MongoDB/bcrypt imports here - those
// aren't supported in the Edge runtime). The Credentials provider itself is
// added in auth.ts, which only runs in the Node.js runtime (route handlers).
export default {
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/api/signup" ||
        pathname.startsWith("/api/auth");

      if (pathname === "/") {
        return Response.redirect(
          new URL(isLoggedIn ? "/dashboard" : "/login", request.nextUrl)
        );
      }

      if (isPublic) {
        if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (!isLoggedIn && pathname.startsWith("/api/")) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
