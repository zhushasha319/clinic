//middleware.ts 负责“拦不拦”
//auth.config.ts 负责“怎么判断 + 怎么处理”

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

//configure which paths the middleware should run on

export const config = {
  matcher: ["/admin/:path*", "/user/:path*", "/appointments/:path*"],
};
