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
  providers: [], // Providers 在主 auth.ts 中定义
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user; // true / false
      const isTryingToAccessProtectedPath = isProtectedPath(nextUrl.pathname);

      if (!isLoggedIn && isTryingToAccessProtectedPath) {
        // 构建带 callback 的重定向 URL
        const callbackUrl = nextUrl.pathname + nextUrl.search;
        const redirectUrl = new URL("/sign-in", nextUrl.origin);
        // 让 URLSearchParams 处理编码；encodeURI 会保留 "&" 导致查询串错误。
        redirectUrl.searchParams.set("callbackUrl", callbackUrl);

        return NextResponse.redirect(redirectUrl);
      }

      // 已登录或非受保护路径则放行
      return true;
    },
  },
};

