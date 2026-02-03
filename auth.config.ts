// 安全与访问控制配置：由 middleware.ts 调用
import { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/admin", "/user", "/appointments"];

const isProtectedPath = (path: string) => {
  return protectedPaths.some((protectedPath) => path.startsWith(protectedPath));
};

// 允许访客访问预约信息页，实际权限由页面内 appointmentId + guestIdentifier 校验。
const isGuestPatientDetailsPath = (path: string) =>
  path === "/appointments/patient-details";

export const authConfig: NextAuthConfig = {
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isTryingToAccessProtectedPath = isProtectedPath(nextUrl.pathname);

      if (!isLoggedIn && isTryingToAccessProtectedPath) {
        if (isGuestPatientDetailsPath(nextUrl.pathname)) {
          return true;
        }

        const callbackUrl = nextUrl.pathname + nextUrl.search;
        const redirectUrl = new URL("/sign-in", nextUrl.origin);
        redirectUrl.searchParams.set("callbackUrl", callbackUrl);

        return NextResponse.redirect(redirectUrl);
      }

      return true;
    },
  },
};
