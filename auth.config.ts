//保安手册，被middleware.ts调用
//检查用户是否有权限访问受保护的路径，如果没有则重定向到登录页面，并附带回调 URL。
import NextAuth, { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/admin", "/user", "/appointments"];

// 检查路径是否受保护
const isProtectedPath = (path: string) => {
  return protectedPaths.some((protectedPath) => path.startsWith(protectedPath));
};

export const authConfig: NextAuthConfig = {
  providers: [], // Providers are defined in the main auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user; //true or false
      const isTryingToAccessProtectedPath = isProtectedPath(nextUrl.pathname);

      if (!isLoggedIn && isTryingToAccessProtectedPath) {
        // Build the redirect URL with a callback
        const callbackUrl = nextUrl.pathname + nextUrl.search;
        const redirectUrl = new URL("/sign-in", nextUrl.origin);
        // Let URLSearchParams handle encoding. encodeURI would keep '&' and break the query string.
        redirectUrl.searchParams.set("callbackUrl", callbackUrl);

        return NextResponse.redirect(redirectUrl);
      }

      // If logged in or the path is not protected, allow access
      return true;
    },
  },
};
